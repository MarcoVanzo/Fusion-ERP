<?php
/**
 * Results Controller — FIPAV Match Results Scraper
 * Fusion ERP v1.0
 *
 * Scrapes match results from venezia.portalefipav.net and returns JSON.
 * Results are cached on the server for 15 minutes to avoid hammering the portal.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Results;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;

class ResultsController
{
    private const BASE_URL = 'https://venezia.portalefipav.net';
    private const MOBILE_URL = self::BASE_URL . '/mobile/risultati.asp?menu=no';
    private const DESKTOP_URL = self::BASE_URL . '/risultati-classifiche.aspx?PId=7269';
    private const CACHE_TTL = 900; // 15 minutes
    private const USER_AGENT = 'Mozilla/5.0 (compatible; FusionERP/1.0)';
    // Highlight these team name fragments as "our team"
    private const OUR_TEAM_KEYWORDS = ['fusion', 'team volley', 'fusionteam'];

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api?module=results&action=getCampionati
     * Returns the list of championships available on the portal.
     */
    public function getCampionati(): void
    {
        Auth::requireAuth();

        $cacheKey = 'campionati';
        $cached = $this->_getCache($cacheKey);
        if ($cached !== null) {
            Response::success($cached);
            return;
        }

        $errDetails = '';
        $html = $this->_fetch(self::MOBILE_URL, $errDetails);
        if ($html === null) {
            Response::error("Impossibile connettersi al portale FIPAV. Dettaglio tecnico: {$errDetails}", 502);
        }

        $campionati = $this->_parseCampionati($html);
        $payload = ['campionati' => $campionati, 'last_updated' => date('c')];

        $this->_setCache($cacheKey, $payload);
        Response::success($payload);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api?module=results&action=getResults&campionato_id=XYZ
     * Returns matches for a specific championship.
     */
    public function getResults(): void
    {
        Auth::requireAuth();

        $campionatoId = trim((string)filter_input(INPUT_GET, 'campionato_id', FILTER_SANITIZE_SPECIAL_CHARS));
        $campionatoUrl = trim((string)filter_input(INPUT_GET, 'campionato_url', FILTER_SANITIZE_URL));

        if (empty($campionatoId) && empty($campionatoUrl)) {
            // Return all (first page scrape)
            $campionatoId = 'all';
        }

        $cacheKey = 'results_' . md5($campionatoId . $campionatoUrl);
        $cached = $this->_getCache($cacheKey);
        if ($cached !== null) {
            Response::success($cached);
            return;
        }

        // Build URL
        if (!empty($campionatoUrl)) {
            // Ensure it's from the same portal domain (security)
            if (!str_contains($campionatoUrl, 'portalefipav.net')) {
                Response::error('URL campionato non valido.', 400);
            }
            $url = $campionatoUrl;
        }
        elseif ($campionatoId === 'all') {
            $url = self::MOBILE_URL;
        }
        else {
            $url = self::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . urlencode($campionatoId);
        }

        $errDetails = '';
        $html = $this->_fetch($url, $errDetails);
        if ($html === null) {
            Response::error("Impossibile connettersi al portale FIPAV. Dettaglio tecnico: {$errDetails}", 502);
        }

        $matches = $this->_parseMatches($html);

        // Tag our team's matches
        foreach ($matches as &$match) {
            $match['is_our_team'] = $this->_isOurTeam($match['home'] ?? '', $match['away'] ?? '');
        }
        unset($match);

        // Sort: upcoming first, then most recent
        usort($matches, static function (array $a, array $b): int {
            $da = strtotime($a['date'] ?? '') ?: 0;
            $db = strtotime($b['date'] ?? '') ?: 0;
            $now = time();
            $futA = $da >= $now;
            $futB = $db >= $now;
            if ($futA && !$futB)
                return -1;
            if (!$futA && $futB)
                return 1;
            return $futA ? ($da - $db) : ($db - $da);
        });

        $payload = [
            'matches' => $matches,
            'total' => count($matches),
            'last_updated' => date('c'),
            'source_url' => $url,
        ];

        $this->_setCache($cacheKey, $payload);
        Response::success($payload);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api?module=results&action=getStandings&campionato_url=...
     * Returns standings table for a championship.
     */
    public function getStandings(): void
    {
        Auth::requireAuth();

        $campionatoUrl = trim((string)filter_input(INPUT_GET, 'campionato_url', FILTER_SANITIZE_URL));

        if (empty($campionatoUrl) || !str_contains($campionatoUrl, 'portalefipav.net')) {
            Response::error('Parametro campionato_url mancante o non valido.', 400);
        }

        $cacheKey = 'standings_' . md5($campionatoUrl);
        $cached = $this->_getCache($cacheKey);
        if ($cached !== null) {
            Response::success($cached);
            return;
        }

        $errDetails = '';
        $html = $this->_fetch($campionatoUrl, $errDetails);
        if ($html === null) {
            Response::error("Impossibile connettersi al portale FIPAV. Dettaglio tecnico: {$errDetails}", 502);
        }

        $standings = $this->_parseStandings($html);

        // Tag our team
        foreach ($standings as &$row) {
            $row['is_our_team'] = $this->_isOurTeam($row['team'] ?? '');
        }
        unset($row);

        $payload = [
            'standings' => $standings,
            'last_updated' => date('c'),
        ];

        $this->_setCache($cacheKey, $payload);
        Response::success($payload);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — HTTP
    // ─────────────────────────────────────────────────────────────────────────

    private function _fetch(string $url, string&$errorDetails = ''): ?string
    {
        // Realistic browser User-Agent (improves compatibility with portals that block bots)
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_ENCODING => '', // Accept any encoding (auto-decode)
            // SSL — enforce peer verification for security despite shared hosting limits
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_CAINFO => dirname(__DIR__, 2) . '/Shared/cacert.pem',
            CURLOPT_HTTPHEADER => [
                'User-Agent: ' . $userAgent,
                'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language: it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                'Accept-Encoding: gzip, deflate, br',
                'Connection: keep-alive',
                'Upgrade-Insecure-Requests: 1',
                'Cache-Control: no-cache',
            ],
        ]);

        $html = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        $curlErrNo = curl_errno($ch);


        if ($httpCode === 404 || $httpCode === 410) {
            return ''; // Championship removed or doesn't exist anymore
        }

        if ($html === false || $curlErrNo !== 0 || $httpCode >= 400) {
            $hc = (string)$httpCode;
            $ce = (string)$curlErrNo;
            $errorDetails = "HTTP {$hc} | cURL #{$ce}: {$curlError}";
            error_log("[Results] Fetch failed: {$errorDetails} | URL: {$url}");
            return null;
        }

        // Detect charset and convert to UTF-8 if needed
        if (is_string($html) && preg_match('/charset=([\w-]+)/i', $html, $m)) {
            $charset = strtolower($m[1]);
            if ($charset !== 'utf-8') {
                $converted = mb_convert_encoding($html, 'UTF-8', $charset);
                if ($converted !== false) {
                    $html = $converted;
                }
            }
        }

        return is_string($html) ? $html : null;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — PARSERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Parse the list of campionati from the mobile page.
     * Real structure:
     *   <h2 class="elencoCampionati" id="ciIdXXX">Category Name</h2>
     *   <ul class="elencoCampionati2" id="ulXXX">
     *     <li><a href="/mobile/risultati.asp?CampionatoId=YYYY">Championship Label</a></li>
     *   </ul>
     */
    private function _parseCampionati(string $html): array
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);

        $campionati = [];

        // PRIMARY: <a href="/mobile/risultati.asp?CampionatoId=..."> inside elencoCampionati2 lists
        $links = $xpath->query('//ul[contains(@class,"elencoCampionati2")]//a[@href]');
        if ($links && $links->length > 0) {
            foreach ($links as $a) {
                /** @var \DOMElement $a */
                $href = $a->getAttribute('href');
                $label = trim(preg_replace('/\s+/', ' ', $a->textContent));
                if (empty($label) || empty($href)) {
                    continue;
                }
                // Make absolute
                if (!str_starts_with($href, 'http')) {
                    $href = self::BASE_URL . $href;
                }
                // Extract CampionatoId
                preg_match('/[?&]CampionatoId=(\d+)/i', $href, $m);
                if (empty($m[1])) {
                    continue;
                }
                $campionati[] = [
                    'id' => $m[1],
                    'label' => $label,
                    'url' => self::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $m[1],
                    'standings_url' => self::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $m[1] . '&vis=classifica',
                ];
            }
        }

        // FALLBACK: any <a> href containing CampionatoId
        if (empty($campionati)) {
            $links = $xpath->query('//a[contains(@href,"CampionatoId")]');
            if ($links) {
                foreach ($links as $a) {
                    /** @var \DOMElement $a */
                    $href = $a->getAttribute('href');
                    $label = trim(preg_replace('/\s+/', ' ', $a->textContent));
                    if (empty($label) || empty($href)) {
                        continue;
                    }
                    if (!str_starts_with($href, 'http')) {
                        $href = self::BASE_URL . $href;
                    }
                    preg_match('/CampionatoId=(\d+)/i', $href, $m);
                    if (empty($m[1])) {
                        continue;
                    }
                    $campionati[] = [
                        'id' => $m[1],
                        'label' => $label,
                        'url' => self::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $m[1],
                        'standings_url' => self::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $m[1] . '&vis=classifica',
                    ];
                }
            }
        }

        // Deduplicate by id
        $seen = [];
        $result = [];
        foreach ($campionati as $c) {
            if (!isset($seen[$c['id']])) {
                $seen[$c['id']] = true;
                $result[] = $c;
            }
        }
        return $result;
    }

    /**
     * Parse match results from a championship page.
     * Real structure:
     *   <a class="gara" href="/mobile/risultati.asp?CampionatoId=X&GaraId=Y">
     *     <div class="squadraCasa">TEAM A</div>
     *     <div class="squadraOspite">TEAM B</div>
     *     <div class="risultatoFinal">3 - 1</div>  (if played)
     *     <div class="data">DD/MM/YYYY HH:MM</div>
     *   </a>
     */
    private function _parseMatches(string $html): array
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);

        $matches = [];

        // PRIMARY: <a class="gara"> elements (mobile portal)
        $garaLinks = $xpath->query('//a[contains(@class,"gara")]');
        if ($garaLinks && $garaLinks->length > 0) {
            foreach ($garaLinks as $gara) {
                /** @var \DOMElement $gara */
                $href = $gara->getAttribute('href');

                // Extract GaraId for use as match ID
                preg_match('/GaraId=(\d+)/i', $href, $mId);
                $garaId = $mId[1] ?? null;

                // Home team
                $casaNodes = $xpath->query('.//*[contains(@class,"squadraCasa")]', $gara);
                $home = $casaNodes && $casaNodes->length > 0
                    ? trim(preg_replace('/\s+/', ' ', $casaNodes->item(0)->textContent))
                    : null;

                // Away team
                $ospiteNodes = $xpath->query('.//*[contains(@class,"squadraOspite")]', $gara);
                $away = $ospiteNodes && $ospiteNodes->length > 0
                    ? trim(preg_replace('/\s+/', ' ', $ospiteNodes->item(0)->textContent))
                    : null;

                if (empty($home) || empty($away)) {
                    continue;
                }

                $match = [
                    'id' => $garaId,
                    'date' => null,
                    'time' => null,
                    'home' => $home,
                    'away' => $away,
                    'score' => null,
                    'sets_home' => null,
                    'sets_away' => null,
                    'status' => 'scheduled',
                    'round' => null,
                    'is_our_team' => false,
                ];

                // Score: look for risultatoFinal, risultato, parziale-style divs
                $scoreNodes = $xpath->query('.//*[
                    contains(@class,"risultatoFinal") or
                    contains(@class,"risultato") or
                    contains(@class,"setResult")
                ]', $gara);
                if ($scoreNodes && $scoreNodes->length > 0) {
                    $scoreText = trim($scoreNodes->item(0)->textContent);
                    if (preg_match('/(\d)\s*[-–]\s*(\d)/', $scoreText, $ms)) {
                        $match['sets_home'] = (int)$ms[1];
                        $match['sets_away'] = (int)$ms[2];
                        $match['score'] = $ms[1] . ' - ' . $ms[2];
                        $match['status'] = 'played';
                    }
                }

                // Date/time: look for data, orario divs, or parse full text
                $dataNodes = $xpath->query('.//*[
                    contains(@class,"data") or
                    contains(@class,"orario") or
                    contains(@class,"dataora")
                ]', $gara);
                if ($dataNodes && $dataNodes->length > 0) {
                    $dateText = trim($dataNodes->item(0)->textContent);
                    if (preg_match('/(\d{1,2}\/\d{1,2}\/\d{4})/', $dateText, $md)) {
                        $match['date'] = $md[1];
                    }
                    if (preg_match('/(\d{1,2}:\d{2})/', $dateText, $mt)) {
                        $match['time'] = $mt[1];
                    }
                }

                // Fallback: search full text of the <a> element for date/time
                if ($match['date'] === null) {
                    $fullText = $gara->textContent;
                    if (preg_match('/(\d{1,2}\/\d{1,2}\/\d{4})/', $fullText, $md)) {
                        $match['date'] = $md[1];
                    }
                    if (preg_match('/(\d{1,2}:\d{2})/', $fullText, $mt)) {
                        $match['time'] = $mt[1];
                    }
                    // Also check for score in the full text if not found above
                    if ($match['score'] === null && preg_match('/(\d)\s*[-–]\s*(\d)/', $fullText, $ms)) {
                        $match['sets_home'] = (int)$ms[1];
                        $match['sets_away'] = (int)$ms[2];
                        $match['score'] = $ms[1] . ' - ' . $ms[2];
                        $match['status'] = 'played';
                    }
                }

                // Determine status from date if still scheduled
                if ($match['status'] === 'scheduled' && $match['date'] !== null) {
                    $ts = strtotime(str_replace('/', '-', $match['date']));
                    if ($ts !== false && $ts < time()) {
                        $match['status'] = 'unknown'; // date passed but no score yet
                    }
                }

                $matches[] = $match;
            }
            return $matches;
        }

        // FALLBACK: table-based layout (desktop portal)
        $rows = $xpath->query('//table//tr[td]');
        if ($rows && $rows->length > 0) {
            foreach ($rows as $row) {
                /** @var \DOMElement $row */
                $cells = $xpath->query('td', $row);
                if (!$cells || $cells->length < 3) {
                    continue;
                }
                $texts = [];
                foreach ($cells as $cell) {
                    $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));
                }
                $match = $this->_extractMatchData($texts, $row, $xpath);
                if ($match !== null) {
                    $matches[] = $match;
                }
            }
        }

        return $matches;
    }

    /**
     * Try to extract structured match data from a table row.
     */
    private function _extractMatchData(array $texts, \DOMElement $row, \DOMXPath $xpath): ?array
    {
        // Filter out header rows
        $combined = implode(' ', $texts);
        $lower = strtolower($combined);
        if (str_contains($lower, 'squadra') && str_contains($lower, 'data')) {
            return null; // header row
        }
        if (str_contains($lower, 'giornata') && strlen($combined) < 30) {
            return null; // section header
        }

        // We need at least a team name pattern (two words)
        if (!preg_match('/[A-Za-zÀ-ÿ]{3,}\s+[A-Za-zÀ-ÿ]{3,}/', $combined)) {
            return null;
        }

        $match = [
            'id' => null,
            'date' => null,
            'time' => null,
            'home' => null,
            'away' => null,
            'score' => null,
            'sets_home' => null,
            'sets_away' => null,
            'status' => 'scheduled', // scheduled | played | live
            'round' => null,
            'is_our_team' => false,
        ];

        // Scan cells
        foreach ($texts as $i => $text) {
            // Date: DD/MM/YYYY
            if (preg_match('/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/', $text, $m)) {
                $match['date'] = $m[1];
            }
            // Time: HH:MM
            if (preg_match('/\b(\d{1,2}:\d{2})\b/', $text, $m) && $match['time'] === null) {
                $match['time'] = $m[1];
            }
            // Score pattern: 3 - 0, 3-1, etc.
            if (preg_match('/\b([0-3])\s*[-–]\s*([0-3])\b/', $text, $m)) {
                $match['score'] = $m[1] . ' - ' . $m[2];
                $match['sets_home'] = (int)$m[1];
                $match['sets_away'] = (int)$m[2];
                $match['status'] = 'played';
            }
            // Round
            if (preg_match('/\b(\d+)\b/', $text, $m) && $match['round'] === null && strlen($text) <= 4) {
                $match['round'] = (int)$m[1];
            }
        }

        // Extract teams — look for cells with team names (long text, no numbers)
        $teamCells = array_filter($texts, static function (string $t): bool {
            return strlen($t) > 4
            && !preg_match('/^\d+$/', $t)
            && !preg_match('/^\d{1,2}[\/\-]\d{1,2}/', $t)
            && !preg_match('/^\d{1,2}:\d{2}$/', $t)
            && !preg_match('/^[0-3]\s*[-–]\s*[0-3]$/', $t)
            && !in_array(strtolower($t), ['n/d', 'n.d.', '-', '—', '']);
        });

        $teamCells = array_values($teamCells);
        if (count($teamCells) >= 2) {
            $match['home'] = $teamCells[0];
            $match['away'] = $teamCells[1];
        }
        elseif (count($teamCells) === 1) {
            // Single cell "Home vs Away" pattern
            if (preg_match('/^(.+?)\s+(?:vs\.?|[-–])\s+(.+)$/i', $teamCells[0], $m)) {
                $match['home'] = trim($m[1]);
                $match['away'] = trim($m[2]);
            }
        }

        // Must have at least teams to be valid
        if ($match['home'] === null || $match['away'] === null) {
            return null;
        }

        // Set status
        if ($match['score'] === null) {
            $match['status'] = $match['date'] && strtotime(str_replace('/', '-', $match['date'])) < time()
                ? 'unknown'
                : 'scheduled';
        }

        return $match;
    }

    /**
     * Try to parse a match from a block of plain text.
     */
    private function _parseMatchFromText(string $text): ?array
    {
        // Pattern: "TeamA - TeamB 3-1" or date + teams + score
        $match = [
            'id' => null, 'date' => null, 'time' => null,
            'home' => null, 'away' => null,
            'score' => null, 'sets_home' => null, 'sets_away' => null,
            'status' => 'scheduled', 'round' => null, 'is_our_team' => false,
        ];

        if (preg_match('/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/', $text, $m)) {
            $match['date'] = $m[1];
        }
        if (preg_match('/\b(\d{1,2}:\d{2})\b/', $text, $m)) {
            $match['time'] = $m[1];
        }
        if (preg_match('/\b([0-3])\s*[-–]\s*([0-3])\b/', $text, $m)) {
            $match['score'] = $m[1] . ' - ' . $m[2];
            $match['sets_home'] = (int)$m[1];
            $match['sets_away'] = (int)$m[2];
            $match['status'] = 'played';
        }

        // Remove date, time, score from text to isolate team names
        $cleaned = preg_replace([
            '/\b\d{1,2}\/\d{1,2}\/\d{4}\b/',
            '/\b\d{1,2}:\d{2}\b/',
            '/\b[0-3]\s*[-–]\s*[0-3]\b/',
        ], ' ', $text);
        $cleaned = trim(preg_replace('/\s+/', ' ', $cleaned));

        if (preg_match('/^(.+?)\s+[-–]\s+(.+)$/', $cleaned, $m)) {
            $match['home'] = trim($m[1]);
            $match['away'] = trim($m[2]);
        }

        if ($match['home'] === null || strlen($match['home']) < 3) {
            return null;
        }

        return $match;
    }

    /**
     * Parse standings table (classifica).
     */
    private function _parseStandings(string $html): array
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);

        $standings = [];

        $rows = $xpath->query('//table//tr[td]');
        if (!$rows) {
            return $standings;
        }

        foreach ($rows as $idx => $row) {
            /** @var \DOMElement $row */
            $cells = $xpath->query('td', $row);
            if (!$cells || $cells->length < 3) {
                continue;
            }

            $texts = [];
            foreach ($cells as $cell) {
                $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));
            }

            // Skip header rows
            $combined = implode(' ', $texts);
            $lower = strtolower($combined);
            if (str_contains($lower, 'squadra') || str_contains($lower, 'punti') && strlen($combined) < 30) {
                continue;
            }

            // Try to identify: pos, team, played, won, lost, points, ...
            $entry = ['position' => null, 'team' => null, 'played' => null, 'won' => null, 'lost' => null, 'points' => null, 'is_our_team' => false];

            foreach ($texts as $i => $text) {
                if (preg_match('/^\d+$/', $text)) {
                    if ($entry['position'] === null && (int)$text > 0 && (int)$text < 50) {
                        $entry['position'] = (int)$text;
                    }
                    elseif ($entry['played'] === null) {
                        $entry['played'] = (int)$text;
                    }
                    elseif ($entry['won'] === null) {
                        $entry['won'] = (int)$text;
                    }
                    elseif ($entry['lost'] === null) {
                        $entry['lost'] = (int)$text;
                    }
                    elseif ($entry['points'] === null) {
                        $entry['points'] = (int)$text;
                    }
                }
                elseif (strlen($text) > 3 && $entry['team'] === null && !preg_match('/^\d/', $text)) {
                    $entry['team'] = $text;
                }
            }

            if (!empty($entry['team'])) {
                $standings[] = $entry;
            }
        }

        return $standings;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — CACHE (file-based, /tmp)
    // ─────────────────────────────────────────────────────────────────────────

    private function _cacheFile(string $key): string
    {
        $cacheDir = __DIR__ . '/../../../../cache'; // outside api/ root, project private storage
        if (!is_dir($cacheDir)) {
            @mkdir($cacheDir, 0755, true);
        }
        return $cacheDir . '/fusion_results_' . md5($key) . '.json';
    }

    private function _getCache(string $key): ?array
    {
        $file = $this->_cacheFile($key);
        if (!file_exists($file)) {
            return null;
        }
        if ((time() - filemtime($file)) > self::CACHE_TTL) {
            @unlink($file);
            return null;
        }
        $data = @file_get_contents($file);
        if ($data === false) {
            return null;
        }
        $decoded = json_decode($data, true);
        return is_array($decoded) ? $decoded : null;
    }

    private function _setCache(string $key, array $data): void
    {
        $file = $this->_cacheFile($key);
        @file_put_contents($file, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private function _isOurTeam(string...$names): bool
    {
        foreach ($names as $name) {
            $lower = strtolower($name);
            foreach (self::OUR_TEAM_KEYWORDS as $kw) {
                if (str_contains($lower, strtolower($kw))) {
                    return true;
                }
            }
        }
        return false;
    }
}