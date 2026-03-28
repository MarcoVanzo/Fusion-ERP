<?php
/**
 * Results Service
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Results;

use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Results\Services\FipavParserService;

class ResultsService
{
    private ResultsRepository $repository;
    private FipavScraperClient $scraperClient;
    private FipavParserService $parserService;

    const OUR_TEAM_KEYWORDS = ['Fusion', 'Team Volley', 'Tmb', 'Olimpia', 'Vega', 'Ecodent'];

    public function __construct(ResultsRepository $repository)
    {
        $this->repository = $repository;
        $this->scraperClient = new FipavScraperClient([$this, 'isOurTeam']);
        $this->parserService = new FipavParserService([$this, 'isOurTeam']);
    }

    public function isOurTeam(string ...$names): bool
    {
        foreach ($names as $name) {
            if ($name === null) continue;
            $lower = strtolower($name);
            if (preg_match('/a\.?\s?p\.?\s?v\.?/i', $lower))
                continue;
            foreach (self::OUR_TEAM_KEYWORDS as $kw) {
                if (str_contains($lower, strtolower($kw)))
                    return true;
            }
        }
        return false;
    }

    /**
     * Sincronizza i risultati e le classifiche per un campionato esistente o passandone i dettagli.
     */
    public function syncChampionshipData(string $id): array
    {
        $champ = $this->repository->getChampionshipById($id);
        if (!$champ) {
            return ['success' => false, 'error' => 'Not found'];
        }

        $url = $champ['url'];

        // Upgrade mobile FIPAV URL to desktop equivalent per scaricare i loghi
        if (preg_match('/^(https?:\/\/[^\/]+)\/mobile\/(?:classifiche|risultati)\.asp\?CampionatoId=([A-Za-z0-9_]+)/i', $url, $m)) {
            $baseUrl = $m[1];
            $cid = $m[2];
            $url = $baseUrl . '/risultati-classifiche.aspx?CId=' . $cid;
        }

        $err = '';
        $htmlM = $this->scraperClient->fetch($url, $err);

        if (empty($htmlM)) {
            return ['success' => false, 'error' => 'Errore di connessione al portale federale (WAF/Timeout): ' . $err];
        }
        if (is_string($htmlM) && (str_contains($htmlM, 'Cloudflare') || str_contains($htmlM, 'Just a moment...'))) {
            return ['success' => false, 'error' => 'Il portale ha bloccato la richiesta (Cloudflare CAPTCHA). Riprova più tardi.'];
        }

        // Estrazione Partite (Matches)
        $matches = [];
        if ($htmlM) {
            if (str_contains($url, 'fipavveneto.net')) {
                $matches = $this->parserService->parseMatchesFipavVeneto($htmlM);
            } elseif (str_contains($url, 'federvolley.it')) {
                // Inietta un fallback se il metodo originario restituiva "parsed=..."
                // Utilizziamo un semplice alias o la wrapper se presente.
                // Siccome il codice interno di FipavScraperClient chiamava _parseMatchesFedervolley(...), chiamiamolo.
                $matches = $this->parserService->parseMatchesFedervolley($url, $htmlM);
            } else {
                $matches = $this->parserService->parseMatches($htmlM);
            }
        }

        // Safeguard se le partite parse sono zero ma sul DB ce n'erano
        if (empty($matches)) {
            $existingCount = $this->repository->countMatchesByChampionship($id);
            if ($existingCount > 0) {
                return [
                    'success' => false, 
                    'error' => 'Il portale non ha restituito partite (possibile blocco o cambio layout). Le ' . ((string) $existingCount) . ' partite esistenti sono state mantenute per sicurezza.'
                ];
            }
        }

        // Estrazione Classifiche (Standings)
        $standings = [];
        $standingsUrlUsed = null;

        if (str_contains($url, 'federvolley.it')) {
            $fvParams = $this->parserService->extractFedervolleyApiParams($url, $htmlM);
            if ($fvParams && $fvParams['girone']) {
                $errClassifica = '';
                $giornateBody = $this->scraperClient->fetch(
                    "{$fvParams['base']}/live_score/giornate/{$fvParams['serie']}/{$fvParams['sesso']}/{$fvParams['stagione']}/{$fvParams['girone']}",
                    $errClassifica
                );
                $giornateData = $giornateBody ? json_decode($giornateBody, true) : null;
                $ultimaGiocata = (int)($giornateData['ultimagiornata'] ?? 1);
                
                $standings = $this->parserService->parseStandingsFedervolley($fvParams, $ultimaGiocata);
                
                $g = (string)$ultimaGiocata;
                $standingsUrlUsed = "{$fvParams['base']}/moduli/campionati/classifica/classifica.php"
                    . "?serie={$fvParams['serie']}&sesso={$fvParams['sesso']}&stagione={$fvParams['stagione']}"
                    . "&giornata={$g}&girone={$fvParams['girone']}";
            }
        } else {
            // FIPAV Venezia / Provinciale / Regionale
            // Fallback usando URL candidati estratti dal client
            $candidateUrls = $this->getStandingsUrlCandidates($url);
            if (!empty($champ['standings_url']) && !in_array($champ['standings_url'], $candidateUrls, true)) {
                array_unshift($candidateUrls, $champ['standings_url']);
            }

            foreach ($candidateUrls as $sUrl) {
                $errClassifica = '';
                $htmlS = $this->scraperClient->fetch($sUrl, $errClassifica);
                if (!$htmlS) continue;

                $parsed = str_contains($sUrl, 'fipavveneto.net')
                    ? $this->parserService->parseStandingsFipavVeneto($htmlS)
                    : $this->parserService->parseStandings($htmlS);

                if (!empty($parsed)) {
                    $standings = $parsed;
                    $standingsUrlUsed = $sUrl;
                    break;
                }
            }
        }

        // Sanitizzazione dati (A03:2021)
        foreach ($matches as &$m) {
            if (isset($m['home'])) $m['home'] = strip_tags((string)$m['home']);
            if (isset($m['away'])) $m['away'] = strip_tags((string)$m['away']);
            if (isset($m['score'])) $m['score'] = strip_tags((string)$m['score']);
            if (isset($m['round'])) $m['round'] = strip_tags((string)$m['round']);
            if (isset($m['status'])) $m['status'] = strip_tags((string)$m['status']);
        }
        unset($m);
        foreach ($standings as &$s) {
            if (isset($s['team'])) $s['team'] = strip_tags((string)$s['team']);
        }
        unset($s);

        // Salvataggio su database tramite repository
        try {
            $this->repository->replaceMatchesAndStandings($id, $matches, $standings, $standingsUrlUsed);
            return [
                'success' => true, 
                'matches' => count($matches), 
                'standings' => count($standings), 
                'standings_url' => $standingsUrlUsed
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Logica di URL discovery per le classifiche
     */
    private function getStandingsUrlCandidates(string $matchUrl): array
    {
        $candidates = [];
        preg_match('/^(https?:\/\/[^\/]+)/i', $matchUrl, $baseM);
        $baseUrl = $baseM[1] ?? 'https://venezia.portalefipav.net';

        // Detect mobile ID
        if (preg_match('/[?&]CampionatoId=([^&]+)/i', $matchUrl, $m)) {
            $cid = $m[1];
            // Desktop first to get logos
            $candidates[] = $baseUrl . '/risultati-classifiche.aspx?CId=' . $cid;
            $candidates[] = $baseUrl . '/classifica.aspx?CId=' . $cid;
            $candidates[] = $baseUrl . '/mobile/classifiche.asp?CampionatoId=' . $cid;
            $candidates[] = $baseUrl . '/mobile/risultati.asp?CampionatoId=' . $cid . '&vis=classifica';
        }

        // Desktop pattern
        if (preg_match('/[?&]CId=(\d+)/i', $matchUrl, $m)) {
            $candidates[] = $baseUrl . '/classifica.aspx?CId=' . $m[1];
        }

        // Generic fallback
        $fallback = $this->getStandingsUrl($matchUrl);
        if (!in_array($fallback, $candidates)) {
            $candidates[] = $fallback;
        }

        return array_values(array_unique($candidates));
    }

    private function getStandingsUrl(string $url): string
    {
        if (str_contains($url, 'federvolley.it')) {
            if (str_contains($url, 'calendario'))
                return str_replace('calendario', 'classifica', $url);
            return $url . (str_contains($url, '?') ? '&' : '?') . 'view=classifica';
        }

        if (str_contains($url, 'risultati-classifiche.aspx') && preg_match('/[?&]CId=(\d+)/i', $url, $m))
            return 'https://venezia.portalefipav.net/classifica.aspx?CId=' . $m[1];

        if (str_contains($url, 'risultati.aspx'))
            return str_replace('risultati.aspx', 'classifiche.aspx', $url);

        if (str_contains($url, 'calendari-gare'))
            return str_replace('calendari-gare', 'classifiche', $url);

        if (str_contains($url, '/mobile/risultati.asp') && preg_match('/[?&]CampionatoId=([^&]+)/i', $url, $m))
            return 'https://venezia.portalefipav.net/mobile/classifiche.asp?CampionatoId=' . $m[1];

        return $url . (str_contains($url, '?') ? '&' : '?') . 'vis=classifica';
    }
}
