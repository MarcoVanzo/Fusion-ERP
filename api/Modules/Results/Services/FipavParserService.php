<?php

declare(strict_types=1);

namespace FusionERP\Modules\Results\Services;

class FipavParserService
{
    private $isOurTeamCallback;

    public function __construct(?callable $isOurTeamCallback = null) {
        $this->isOurTeamCallback = $isOurTeamCallback;
    }

    private function isOurTeam(string ...$names): bool {
        if ($this->isOurTeamCallback) {
            return call_user_func($this->isOurTeamCallback, ...$names);
        }
        return false;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — PARSERS
    // ─────────────────────────────────────────────────────────────────────────

    private function fetch(string $url, string &$error): ?string
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $body = curl_exec($ch);
        if ($body === false) {
            $error = curl_error($ch);

            return null;
        }

        return is_string($body) ? $body : null;
    }

    /**
     * Parse the list of campionati from the mobile page.
     */
    public function parseCampionati(string $html): array
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
                    $href = \FusionERP\Modules\Results\FipavScraperClient::BASE_URL . $href;
                }
                // Extract CampionatoId
                preg_match('/[?&]CampionatoId=(\d+)/i', $href, $m);
                if (empty($m[1])) {
                    continue;
                }
                $campionati[] = [
                    'id' => $m[1],
                    'label' => $label,
                    'url' => \FusionERP\Modules\Results\FipavScraperClient::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $m[1],
                    'standings_url' => \FusionERP\Modules\Results\FipavScraperClient::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $m[1] . '&vis=classifica',
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
                        $href = \FusionERP\Modules\Results\FipavScraperClient::BASE_URL . $href;
                    }
                    preg_match('/CampionatoId=(\d+)/i', $href, $m);
                    if (empty($m[1])) {
                        continue;
                    }
                    $campionati[] = [
                        'id' => $m[1],
                        'label' => $label,
                        'url' => \FusionERP\Modules\Results\FipavScraperClient::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $m[1],
                        'standings_url' => \FusionERP\Modules\Results\FipavScraperClient::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $m[1] . '&vis=classifica',
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
     */
    public function parseMatches(string $html): array
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
                preg_match('/GaraId=(\d+)/i', $href, $mId);
                $garaId = $mId[1] ?? null;

                $casaNodes = $xpath->query('.//*[contains(@class,"squadraCasa")]', $gara);
                $home = $casaNodes && $casaNodes->length > 0 ? trim(preg_replace('/\s+/', ' ', $casaNodes->item(0)->textContent)) : null;

                $ospiteNodes = $xpath->query('.//*[contains(@class,"squadraOspite")]', $gara);
                $away = $ospiteNodes && $ospiteNodes->length > 0 ? trim(preg_replace('/\s+/', ' ', $ospiteNodes->item(0)->textContent)) : null;

                if (empty($home) || empty($away))
                    continue;

                $round = null;
                $precedings = $xpath->query('preceding::*[contains(translate(text(), "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdefghijklmnopqrstuvwxyz"), "giornata")][1]', $gara);
                if ($precedings && $precedings->length > 0) {
                    $roundText = trim($precedings->item(0)->textContent);
                    if (preg_match('/(\d+)[°a-zA-Z\s]*\s*giornata/i', $roundText, $mRound) || preg_match('/giornata\s*(\d+)/i', $roundText, $mRound)) {
                        $round = $mRound[1];
                    }
                }

                $match = [
                    'id' => $garaId, 'date' => null, 'time' => null,
                    'home' => $home, 'away' => $away,
                    'score' => null, 'sets_home' => null, 'sets_away' => null,
                    'status' => 'scheduled', 'round' => $round, 'is_our_team' => false,
                ];

                $scoreNodes = $xpath->query('.//*[contains(@class,"risultatoFinal") or contains(@class,"risultato") or contains(@class,"setResult")]', $gara);
                if ($scoreNodes && $scoreNodes->length > 0) {
                    $scoreText = trim($scoreNodes->item(0)->textContent);
                    if (preg_match('/(\d)\s*[-–]\s*(\d)/', $scoreText, $ms)) {
                        $match['sets_home'] = (int)$ms[1];
                        $match['sets_away'] = (int)$ms[2];
                        $match['score'] = $ms[1] . ' - ' . $ms[2];
                        $match['status'] = 'played';
                    }
                }

                $dataNodes = $xpath->query('.//*[contains(@class,"data") or contains(@class,"orario") or contains(@class,"dataora")]', $gara);
                if ($dataNodes && $dataNodes->length > 0) {
                    $dateText = trim($dataNodes->item(0)->textContent);
                    // Handle dd/mm/yyyy, dd/mm/yy, and dd/mm with slash or hyphen
                    if (preg_match('/(\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?)/', $dateText, $md)) {
                        $match['date'] = str_replace('-', '/', $md[1]);
                    }
                    if (preg_match('/(\d{1,2}:\d{2})/', $dateText, $mt)) {
                        $match['time'] = $mt[1];
                    }
                }

                $matches[] = $match;
            }
            return $matches;
        }

        // FALLBACK: table-based layout
        $rows = $xpath->query('//table//tr[td]');
        if ($rows && $rows->length > 0) {
            $currentRound = null;
            foreach ($rows as $row) {
                /** @var \DOMElement $row */
                $cells = $xpath->query('td', $row);
                if (!$cells || $cells->length < 3)
                    continue;
                $texts = [];
                foreach ($cells as $cell)
                    $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));

                $combined = implode(' ', $texts);
                if (preg_match('/(\d+)[°a-zA-Z\s]*\s*giornata/i', $combined, $mRound) || preg_match('/giornata\s*(\d+)/i', $combined, $mRound)) {
                    $currentRound = $mRound[1];
                }

                $match = $this->extractMatchData($texts, $row, $xpath);
                if ($match !== null) {
                    if (empty($match['round'])) {
                        $match['round'] = $currentRound;
                    }
                    $matches[] = $match;
                }
            }
        }

        return $matches;
    }

    /** Extract structured match data from table cells. */
    public function extractMatchData(array $texts, \DOMElement $row, \DOMXPath $xpath): ?array
    {
        $combined = implode(' ', $texts);
        $lower = strtolower($combined);
        if (str_contains($lower, 'squadra') && str_contains($lower, 'data'))
            return null;
        if (str_contains($lower, 'giornata') && strlen($combined) < 30)
            return null;
        if (!preg_match('/[A-Za-zÀ-ÿ]{3,}\s+[A-Za-zÀ-ÿ]{3,}/', $combined))
            return null;

        $match = [
            'id' => null, 'date' => null, 'time' => null,
            'home' => null, 'away' => null,
            'score' => null, 'sets_home' => null, 'sets_away' => null,
            'status' => 'scheduled', 'round' => null, 'is_our_team' => false,
        ];

        foreach ($texts as $text) {
            if (preg_match('/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/', $text, $m))
                $match['date'] = $m[1];
            if (preg_match('/\b(\d{1,2}:\d{2})\b/', $text, $m) && $match['time'] === null)
                $match['time'] = $m[1];
            if (preg_match('/\b([0-3])\s*[-–]\s*([0-3])\b/', $text, $m)) {
                $match['score'] = $m[1] . ' - ' . $m[2];
                $match['sets_home'] = (int)$m[1];
                $match['sets_away'] = (int)$m[2];
                $match['status'] = 'played';
            }
        }

        // Find teams
        $teamCells = array_values(array_filter($texts, static function (string $t): bool {
            return strlen($t) > 3 && !preg_match('/^\d+\s*$/', $t) && !preg_match('/^\d{1,2}[\/\-]\d{1,2}/', $t)
            && !preg_match('/^\d{1,2}:\d{2}$/', $t) && !preg_match('/^[0-3]\s*[-–]\s*[0-3]$/', $t)
            && !in_array(strtolower($t), ['n/d', 'n.d.', '-', '—', '', ' ']);
        }));

        if (count($teamCells) >= 2) {
            $match['home'] = $teamCells[0];
            $match['away'] = $teamCells[1];
        }


        return ($match['home'] && $match['away']) ? $match : null;
    }

    /** Parse standings table — multi-strategy for FIPAV Venezia mobile + desktop portals. */
    public function parseStandings(string $html): array
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);

        // ── STRATEGY 0: FIPAV Venezia /mobile/classifiche.asp — <div class="riga"> rows ──
        // The mobile classifiche.asp page uses a different structure than risultati.asp.
        // Each team row is a <div class="riga"> (or similar) containing spans/divs for pos, name, points.
        $rigaItems = $xpath->query('//*[contains(@class,"riga") and (ancestor::*[contains(@class,"classifica")] or ancestor::*[contains(@class,"tabclassifica")] or ancestor::*[@id and contains(@id,"classif")])]');
        if (!$rigaItems || $rigaItems->length === 0) {
            // Broader fallback: any .riga inside a containing classifica block
            $rigaItems = $xpath->query('//div[contains(@class,"tabella") or contains(@class,"classifica") or contains(@class,"tabclassifica")]//div[contains(@class,"riga")]');
        }
        if ($rigaItems && $rigaItems->length > 0) {
            $standings = [];
            foreach ($rigaItems as $i => $riga) {
                /** @var \DOMElement $riga */
                $text = trim(preg_replace('/\s+/', ' ', $riga->textContent));
                if (empty($text))
                    continue;

                $entry = [
                    'position' => $i + 1, 'team' => null,
                    'played' => null, 'won' => null, 'lost' => null,
                    'points' => null, 'is_our_team' => false,
                ];

                // Position
                $posNodes = $xpath->query('.//*[contains(@class,"pos") or contains(@class,"posizione") or contains(@class,"posiz") or contains(@class,"num")]', $riga);
                if ($posNodes && $posNodes->length > 0) {
                    $pt = trim($posNodes->item(0)->textContent);
                    if (preg_match('/^\d+$/', $pt))
                        $entry['position'] = (int)$pt;
                }
                // Team
                $teamNodes = $xpath->query('.//*[contains(@class,"squadra") or contains(@class,"societa") or contains(@class,"nome") or contains(@class,"team")]', $riga);
                if ($teamNodes && $teamNodes->length > 0)
                    $entry['team'] = trim(preg_replace('/\s+/', ' ', $teamNodes->item(0)->textContent));
                // Points
                $ptsNodes = $xpath->query('.//*[contains(@class,"punti") or contains(@class,"points") or contains(@class,"pti")]', $riga);
                if ($ptsNodes && $ptsNodes->length > 0)
                    $entry['points'] = (int)trim($ptsNodes->item(0)->textContent);
                // Played / Won / Lost from numeric spans
                $numNodes = $xpath->query('.//*[contains(@class,"giocate") or contains(@class,"pg") or contains(@class,"played")]', $riga);
                if ($numNodes && $numNodes->length > 0)
                    $entry['played'] = (int)trim($numNodes->item(0)->textContent);
                $winNodes = $xpath->query('.//*[contains(@class,"vinte") or contains(@class,"vitt") or contains(@class,"won") or contains(@class,"pw")]', $riga);
                if ($winNodes && $winNodes->length > 0)
                    $entry['won'] = (int)trim($winNodes->item(0)->textContent);
                $lostNodes = $xpath->query('.//*[contains(@class,"perse") or contains(@class,"lost") or contains(@class,"pl")]', $riga);
                if ($lostNodes && $lostNodes->length > 0)
                    $entry['lost'] = (int)trim($lostNodes->item(0)->textContent);

                // Regex fallback if team still null
                if ($entry['team'] === null && preg_match('/^(\d+)\s+(.+?)\s+(\d+)(?:\s+(\d+)(?:\s+(\d+)(?:\s+(\d+))?)?)?$/', $text, $m)) {
                    $entry['position'] = (int)$m[1];
                    $entry['team'] = trim($m[2]);
                    $entry['points'] = (int)$m[3];
                    if (isset($m[4]))
                        $entry['played'] = (int)$m[4];
                    if (isset($m[5]))
                        $entry['won'] = (int)$m[5];
                    if (isset($m[6]))
                        $entry['lost'] = (int)$m[6];
                }

                if ($entry['team'] && strlen($entry['team']) > 2)
                    $standings[] = $entry;
            }
            if (!empty($standings)) {
                error_log('[Results] _parseStandings: Strategy 0 (div.riga) found ' . count($standings) . ' entries');
                return $standings;
            }
        }

        // ── STRATEGY 1: FIPAV Venezia mobile portal — <li class="posizione"> or <a class="squadra"> ──
        // The mobile classifica page renders each row as a list item with:
        //   <li><span class="pos">1</span> <a class="squadra">Team Name</a> <span class="punti">12</span> ...</li>
        $liItems = $xpath->query('//*[contains(@class,"classifica")]//li | //ul[contains(@class,"classifica")]//li');
        if ($liItems && $liItems->length > 0) {
            $standings = [];
            foreach ($liItems as $i => $li) {
                /** @var \DOMElement $li */
                $text = trim(preg_replace('/\s+/', ' ', $li->textContent));
                if (empty($text))
                    continue;

                $entry = [
                    'position' => $i + 1,
                    'team' => null,
                    'played' => null,
                    'won' => null,
                    'lost' => null,
                    'points' => null,
                    'is_our_team' => false,
                ];

                // position
                $posNodes = $xpath->query('.//*[contains(@class,"pos") or contains(@class,"posizione") or contains(@class,"posiz")]', $li);
                if ($posNodes && $posNodes->length > 0) {
                    $posText = trim($posNodes->item(0)->textContent);
                    if (preg_match('/^\d+$/', $posText))
                        $entry['position'] = (int)$posText;
                }

                // team name
                $teamNodes = $xpath->query('.//*[contains(@class,"squadra") or contains(@class,"team") or contains(@class,"nome")]', $li);
                if ($teamNodes && $teamNodes->length > 0)
                    $entry['team'] = trim(preg_replace('/\s+/', ' ', $teamNodes->item(0)->textContent));

                // numeric stats (punti, played, won, lost)
                $numNodes = $xpath->query('.//*[contains(@class,"punti") or contains(@class,"points")]', $li);
                if ($numNodes && $numNodes->length > 0)
                    $entry['points'] = (int)trim($numNodes->item(0)->textContent);

                // Fallback: extract numbers from li text when structured nodes not found
                if ($entry['team'] === null) {
                    // Try to extract: "1 Team Name 12 8 6 2"
                    if (preg_match('/^(\d+)\s+(.+?)\s+(\d+)(?:\s+(\d+)(?:\s+(\d+)(?:\s+(\d+))?)?)?$/', $text, $m)) {
                        $entry['position'] = (int)$m[1];
                        $entry['team'] = trim($m[2]);
                        $entry['points'] = (int)$m[3];
                        $entry['played'] = isset($m[4]) ? (int)$m[4] : null;
                        $entry['won'] = isset($m[5]) ? (int)$m[5] : null;
                        $entry['lost'] = isset($m[6]) ? (int)$m[6] : null;
                    }
                }

                if ($entry['team'] && strlen($entry['team']) > 2)
                    $standings[] = $entry;
            }
            if (!empty($standings))
                return $standings;
        }

        // ── STRATEGY 2: Table with classifica/ranking/classement class ──
        $classifTables = $xpath->query(
            '//table[contains(@class,"classifica") or contains(@class,"ranking") or ' .
            'contains(@class,"classement") or contains(@class,"standing")]//tr[td]'
        );
        if ($classifTables && $classifTables->length > 0) {
            $standings = $this->parseStandingsRows($classifTables, $xpath);
            if (!empty($standings))
                return $standings;
        }

        // ── STRATEGY 3: Generic table rows — last resort ──
        $rows = $xpath->query('//table//tr[td]');
        if ($rows && $rows->length > 0)
            return $this->parseStandingsRows($rows, $xpath);

        return [];
    }

    /** Extract standings from a set of table rows. */
    public function parseStandingsRows(\DOMNodeList $rows, \DOMXPath $xpath): array
    {
        $standings = [];
        foreach ($rows as $row) {
            /** @var \DOMElement $row */
            $cells = $xpath->query('td', $row);
            if (!$cells || $cells->length < 3)
                continue;

            $texts = [];
            $cellLogos = [];
            foreach ($cells as $ci => $cell) {
                $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));
                // Extract logo URL from <img> tags inside the cell
                $imgs = $xpath->query('.//img', $cell);
                if ($imgs && $imgs->length > 0) {
                    $imgNode = $imgs->item(0);
                    if ($imgNode instanceof \DOMElement) {
                        $src = $imgNode->getAttribute('src');
                        if ($src && !str_contains($src, 'no-image')) {
                            $cellLogos[$ci] = $src;
                        }
                    }
                }
            }

            $combined = implode(' ', $texts);
            $lower = strtolower($combined);

            // Skip header/separator rows
            if (str_contains($lower, 'squadra') || str_contains($lower, 'classifica') ||
            preg_match('/^(\s*[-–—]+\s*)+$/', $combined))
                continue;

            // Skip rows that look like match results (e.g. "TeamA vs TeamB 3-1")
            if (preg_match('/\b[A-Za-z].{3,}\s+vs\s+[A-Za-z]/i', $combined))
                continue;
            if (preg_match('/\b(\d)\s*[-–]\s*(\d)\b/', $combined) && !preg_match('/^\d+\s/', trim($combined)))
                continue;

            $entry = [
                'position' => null, 'team' => null, 'logo' => null,
                'played' => null, 'won' => null, 'lost' => null,
                'points' => null, 'is_our_team' => false,
            ];

            foreach ($texts as $i => $text) {
                $cleanText = trim(str_replace("\xc2\xa0", ' ', $text));
                if ($i === 0 && preg_match('/^\d+$/', $cleanText))
                    $entry['position'] = (int)$cleanText;
                elseif ($i === 1 && strlen($cleanText) > 2 && !preg_match('/^\d+$/', $cleanText)) {
                    $entry['team'] = $cleanText;
                    // Logo is typically in the same cell as the team name (index 1)
                    if (isset($cellLogos[$i])) {
                        $entry['logo'] = $cellLogos[$i];
                    }
                    elseif (!empty($cellLogos)) {
                        $entry['logo'] = reset($cellLogos);
                    }
                }
                elseif (preg_match('/^\d+$/', $cleanText)) {
                    $val = (int)$cleanText;
                    if ($i === 2)
                        $entry['points'] = $val;
                    elseif ($i === 3)
                        $entry['played'] = $val;
                    elseif ($i === 4)
                        $entry['won'] = $val;
                    elseif ($i === 5)
                        $entry['lost'] = $val;
                }
            }

            if ($entry['position'] && $entry['team'])
                $standings[] = $entry;
        }
        return $standings;
    }

    /** Parse fipavveneto.net matches. */
    public function parseMatchesFipavVeneto(string $html): array
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);

        $matches = [];
        $rows = $xpath->query('//table[contains(@class, "tbl-risultati")]//tr[td]');
        if (!$rows)
            return [];

        foreach ($rows as $row) {
            /** @var \DOMElement $row */
            $cells = $xpath->query('td', $row);
            if (!$cells || $cells->length < 5)
                continue;

            $texts = [];
            foreach ($cells as $cell)
                $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));

            $home = $texts[3] ?? '';
            $away = $texts[4] ?? '';
            if (strlen($home) < 3 || strlen($away) < 3 || preg_match('/^\d+$/', $home))
                continue;

            $match = [
                'id' => trim($texts[0] ?? ''), 'date' => null, 'time' => null,
                'home' => $home, 'away' => $away,
                'score' => null, 'sets_home' => null, 'sets_away' => null,
                'status' => 'scheduled', 'round' => null, 'is_our_team' => false,
            ];

            if (preg_match('/(\d{1,2}\/\d{1,2}\/\d{2,4})/', $texts[2] ?? '', $md))
                $match['date'] = $md[1];
            if (preg_match('/(\d{1,2}:\d{2})/', $texts[2] ?? '', $mt))
                $match['time'] = $mt[1];
            if (preg_match('/\b(\d+)\b/', $texts[1] ?? '', $mr))
                $match['round'] = (int)$mr[1];

            if (preg_match('/\b([0-3])\s*[-–]\s*([0-3])\b/', $texts[5] ?? '', $ms)) {
                $match['sets_home'] = (int)$ms[1];
                $match['sets_away'] = (int)$ms[2];
                $match['score'] = $ms[1] . ' - ' . $ms[2];
                $match['status'] = 'played';
            }

            $matches[] = $match;
        }
        return $matches;
    }

    /**
     * Parse federvolley.it championship pages.
     * Strategy 1: Try Drupal JSON API (views REST endpoint).
     * Strategy 2: Fall back to HTML div-based parsing.
     */
    /**
     * Parse federvolley.it using the official /live_score/* REST API.
     * Endpoint: GET /live_score/giornate/{serie}/{sesso}/{stagione}/{girone}
     * Endpoint: GET /live_score/live-score-calendario/{serie}/{sesso}/{stagione}/{girone}/{giornata}
     */
    public function parseMatchesFedervolley(string $originalUrl, string $html): array
    {
        $p = $this->extractFedervolleyApiParams($originalUrl, $html);
        if ($p) {
            $matches = $this->parseMatchesFedervolleyAPI($p);
            if (!empty($matches))
                return $matches;
            error_log('[Results] federvolley.it REST API returned 0 matches, falling back to HTML');
        }
        return $this->parseMatchesFedervolleyHtml($html);
    }

    /**
     * Extract API params {base, serie, sesso, stagione, girone} from a federvolley.it URL.
     * Serie: B2, A1, A2... Sesso: M/F  Stagione: starting year (2025 for 2025-26)
     */
    public function extractFedervolleyApiParams(string $url, string $html = ''): ?array
    {
        $base = 'https://www.federvolley.it';
        $path = strtolower(parse_url($url, PHP_URL_PATH) ?? '');
        $qs = parse_url($url, PHP_URL_QUERY) ?? '';
        parse_str($qs, $qsParsed);

        // Extract girone from query string (?girone=D)
        $girone = strtoupper(trim($qsParsed['girone'] ?? ''));

        // Detect serie from URL slug
        $serie = null;
        $sesso = null;
        $serieMap = [
            'b2' => 'B2', 'b1' => 'B1', 'a1' => 'A1', 'a2' => 'A2',
            'serie-b2' => 'B2', 'serie-b1' => 'B1', 'serie-a1' => 'A1', 'serie-a2' => 'A2',
        ];
        foreach ($serieMap as $slug => $code) {
            if (str_contains($path, $slug)) {
                $serie = $code;
                break;
            }
        }
        if (!$serie) {
            error_log('[Results] federvolley.it: cannot detect serie from URL: ' . $url);
            return null;
        }

        // Detect sesso
        if (str_contains($path, 'femmin') || str_contains($path, '-f-'))
            $sesso = 'F';
        elseif (str_contains($path, 'maschil') || str_contains($path, '-m-'))
            $sesso = 'M';
        else
            $sesso = 'F'; // default for B2

        // Stagione: FederVolley uses the STARTING year of the season
        // Season runs Sep-May: Jan-Jul → current year - 1; Aug-Dec → current year
        $month = (int)date('n');
        $year = (int)date('Y');
        $stagione = ($month <= 7) ? (string)($year - 1) : (string)$year;

        // If girone not in URL, try to auto-detect from slug (e.g. /girone-d/)
        if (!$girone && preg_match('/girone[_-]([a-z])/i', $path, $gm)) {
            $girone = strtoupper($gm[1]);
        }

        // If still no girone, try to extract it from the HTML javascript variable
        if (!$girone && $html) {
            if (preg_match('/fv_girone\s*=\s*[\'"]([A-Z0-9]+)[\'"]/i', $html, $hm)) {
                $girone = strtoupper($hm[1]);
            }
        }

        return compact('base', 'serie', 'sesso', 'stagione', 'girone');
    }

    /**
     * Fetch all matches using the official /live_score/* REST API.
     * Real JSON structure (verified March 2026):
     *   { "calendario": [ { "squadraA": { "name": "..." }, "squadraB": { "name": "..." },
     *     "risultato": { "A": { "status": "win|loose|", "points": 3 }, "B": {...} },
     *     "data_gara_short": "11/10/2025", "ora_gara": "20:30", "sets": [...] } ] }
     */
    public function parseMatchesFedervolleyAPI(array $p): array
    {
        $base = $p['base'];
        $serie = $p['serie'];
        $sesso = $p['sesso'];
        $stagione = $p['stagione'];
        $girone = $p['girone'];

        // Discover girone if not set
        if (!$girone) {
            $err = '';
            $body = $this->fetch("{$base}/live_score/giornate/{$serie}/{$sesso}/{$stagione}", $err);
            if ($body) {
                $data = json_decode($body, true);
                if (isset($data['gironi'][0]))
                    $girone = (string)$data['gironi'][0];
            }
        }
        if (!$girone) {
            error_log("[Results] federvolley.it REST: cannot determine girone for {$serie}/{$sesso}/{$stagione}");
            return [];
        }

        // Giornate list
        $err = '';
        $giornateUrl = "{$base}/live_score/giornate/{$serie}/{$sesso}/{$stagione}/{$girone}";
        $giornateBody = $this->fetch($giornateUrl, $err);
        $giornateData = $giornateBody ? json_decode($giornateBody, true) : null;
        if (!$giornateData) {
            error_log("[Results] federvolley.it REST: giornate fetch failed: {$err}");
            return [];
        }

        $ultimaGiocata = (int)($giornateData['ultimagiornata'] ?? 0);
        $totalGiornate = count($giornateData['giornate'] ?? []) ?: max($ultimaGiocata, 26);

        error_log("[Results] FV REST " . $serie . "/" . $sesso . "/" . $stagione . "/" . $girone . ": ultima=" . $ultimaGiocata . ", tot=" . $totalGiornate);

        $allMatches = [];
        // Fetch played + 1 upcoming round
        $limit = min($ultimaGiocata + 1, $totalGiornate);
        for ($g = 1; $g <= $limit; $g++) {
            $calUrl = $base . "/live_score/live-score-calendario/" . $serie . "/" . $sesso . "/" . $stagione . "/" . $girone . "/" . $g;
            $calBody = $this->fetch($calUrl, $err);
            if (!$calBody)
                continue;

            $calData = json_decode($calBody, true);
            if (!is_array($calData))
                continue;

            // Real structure: { "calendario": [ {...}, {...} ] }
            $rows = $calData['calendario'] ?? (isset($calData[0]) ? $calData : []);
            if (empty($rows))
                continue;

            foreach ($rows as $row) {
                $home = trim((string)($row['squadraA']['name'] ?? $row['squadraA']['id'] ?? ''));
                $away = trim((string)($row['squadraB']['name'] ?? $row['squadraB']['id'] ?? ''));
                if (!$home || !$away)
                    continue;

                // Result: risultato.A.points / risultato.B.points
                $rA = $row['risultato']['A'] ?? [];
                $rB = $row['risultato']['B'] ?? [];
                $setsHome = isset($rA['points']) && $rA['points'] !== '' ? (int)$rA['points'] : null;
                $setsAway = isset($rB['points']) && $rB['points'] !== '' ? (int)$rB['points'] : null;
                $played = $setsHome !== null && ($setsHome > 0 || $setsAway > 0 || ($rA['status'] ?? '') !== '');
                $status = $played ? 'played' : 'scheduled';

                // Date: "dd/mm/yyyy" + ora_gara "HH:MM"
                $dateStr = null;
                $timeStr = null;
                if (!empty($row['data_gara_short'])) {
                    $dateStr = $row['data_gara_short']; // already "dd/mm/yyyy"
                }
                if (!empty($row['ora_gara'])) {
                    $timeStr = $row['ora_gara'];
                }

                $allMatches[] = [
                    'id' => $row['numero_gara'] ?? null,
                    'date' => $dateStr,
                    'time' => $timeStr,
                    'home' => $home,
                    'away' => $away,
                    'score' => $played ? ($setsHome . ' - ' . $setsAway) : null,
                    'sets_home' => $setsHome,
                    'sets_away' => $setsAway,
                    'status' => $status,
                    'round' => $g,
                ];
            }
        }

        error_log('[Results] FV REST: ' . count($allMatches) . " matches for {$serie}/{$sesso}/{$stagione}/{$girone}");
        return $allMatches;
    }

    /**
     * Fetch standings for federvolley.it via the classifica.php endpoint.
     * Real response: { "classifica": "<html div>" } — unwrap JSON then parse HTML manually
     * because the HTML contains malformed tags and asymmetrical divs that break DOMDocument.
     */
    public function parseStandingsFedervolley(array $p, int $giornata): array
    {
        $base = $p['base'];
        $serie = $p['serie'];
        $sesso = $p['sesso'];
        $stagione = $p['stagione'];
        $girone = $p['girone'];

        $url = $base . "/moduli/campionati/classifica/classifica.php"
            . "?serie=" . $serie . "&sesso=" . $sesso . "&stagione=" . $stagione . "&giornata=" . $giornata . "&girone=" . $girone;

        $err = '';
        $body = $this->fetch($url, $err);
        if (!$body) {
            error_log("[Results] FV classifica fetch failed: {$err}");
            return [];
        }

        // Unwrap JSON envelope {"classifica": "<html>"}
        $html = $body;
        if (str_starts_with(ltrim($body), '{')) {
            $json = json_decode($body, true);
            if (isset($json['classifica']) && is_string($json['classifica'])) {
                $html = $json['classifica'];
            }
        }
        if (empty(trim($html))) {
            error_log("[Results] FV classifica: empty HTML after JSON unwrap");
            return [];
        }

        $standings = [];

        // Parse malformed HTML using Regex since DOMDocument chokes on it.
        // Teams are grouped in `<div class='row sfondo-Blu'>...</div><div class='row sfondo-accordion'`
        $matchesCount = preg_match_all('/<div class=[\'"]row sfondo-[Bb]lu[\'">](.*?)<\/div><div class=[\'"]row sfondo-accordion[\'"]/is', $html, $matches);

        // Se regex matches falliscono, prova table generico
        if ($matchesCount > 0 && !empty($matches[1])) {
            foreach ($matches[1] as $index => $rowHtml) {
                // Team Name: <span class='squadra-tabella'>...</span>
                $teamName = '';
                if (preg_match('/<span class=[\'"]squadra-tabella[\'"]>(.*?)<\/span>/is', $rowHtml, $mTeam)) {
                    $teamName = trim(strip_tags($mTeam[1]));
                }

                if (empty($teamName))
                    continue;

                // Points: <span class='punti-Blu'> o <span class='punti-blu'>
                $pts = 0;
                if (preg_match('/<span class=[\'"]punti-[Bb]lu[\'"]>(.*?)<\/span>/is', $rowHtml, $mPts)) {
                    $pts = (int)trim(strip_tags($mPts[1]));
                }

                // Stats: <div class='col-xs-4'> inside the blu-tabella blocks
                $pg = 0;
                $v = 0;
                $l = 0;
                if (preg_match_all('/<div class=[\'"]col-xs-4[\'"]>(.*?)<\/div>/is', $rowHtml, $mStats) && count($mStats[1]) >= 3) {
                    $pg = (int)trim(strip_tags($mStats[1][0]));
                    $v = (int)trim(strip_tags($mStats[1][1]));
                    $l = (int)trim(strip_tags($mStats[1][2]));
                }

                $standings[] = [
                    'position' => $index + 1,
                    'team' => $teamName,
                    'played' => $pg,
                    'won' => $v,
                    'lost' => $l,
                    'points' => $pts,
                    'is_our_team' => $this->isOurTeam($teamName),
                ];
            }
        }

        // Generic table fallback if RegEx found nothing
        if (empty($standings)) {
            $dom = new \DOMDocument();
            libxml_use_internal_errors(true);
            @$dom->loadHTML('<?xml encoding="UTF-8"><div>' . $html . '</div>');
            libxml_clear_errors();
            $xpath = new \DOMXPath($dom);

            $tableRows = $xpath->query('//table//tr[td]');
            if ($tableRows) {
                foreach ($tableRows as $row) {
                    $cells = $xpath->query('td', $row);
                    if (!$cells || $cells->length < 2)
                        continue;
                    $texts = [];
                    foreach ($cells as $cell)
                        $texts[] = trim($cell->textContent);
                    $team = trim($texts[1] ?? '');
                    if (!$team)
                        continue;
                    $cnt = count($texts);
                    $standings[] = [
                        'position' => (int)($texts[0] ?? 0) ?: count($standings) + 1,
                        'team' => $team,
                        'played' => (int)($texts[2] ?? 0),
                        'won' => (int)($texts[3] ?? 0),
                        'lost' => (int)($texts[4] ?? 0),
                        'points' => (int)($texts[$cnt - 1] ?? 0),
                        'is_our_team' => $this->isOurTeam($team),
                    ];
                }
            }
        }

        error_log('[Results] FV classifica: ' . count($standings) . ' entries from ' . $url);
        return $standings;
    }
    /** Fallback: parse federvolley.it HTML calendar. */
    public function parseMatchesFedervolleyHtml(string $html): array
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        @$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);
        $matches = [];

        $rows = $xpath->query('//*[contains(@class,"views-row") or contains(@class,"match-row") or contains(@class,"gara")]');
        if (!$rows || $rows->length === 0) {
            error_log('[Results] federvolley.it HTML fallback: no rows found');
            return [];
        }
        foreach ($rows as $row) {
            $text = trim($row->textContent);
            if (preg_match('/(.+?)\s+[-–vs]+\s+(.+?)\s+(\d[-–]\d)/i', $text, $m)) {
                $sH = (int)explode(preg_quote($m[3][1]), $m[3])[0];
                $sA = (int)substr($m[3], -1);
                $matches[] = ['home' => trim($m[1]), 'away' => trim($m[2]),
                    'sets_home' => $sH, 'sets_away' => $sA, 'score' => $m[3],
                    'status' => 'played', 'date' => null, 'time' => null, 'id' => null, 'round' => null];
            }
        }
        error_log('[Results] federvolley.it HTML fallback: ' . count($matches) . ' matches');
        return $matches;
    }

    public function parseStandingsFipavVeneto(string $html): array
    {
        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);

        $standings = [];
        $rows = $xpath->query('//table[contains(@class, "tbl-classifica")]//tr[td]');
        if (!$rows)
            return [];

        foreach ($rows as $row) {
            /** @var \DOMElement $row */
            $cells = $xpath->query('td', $row);
            if (!$cells || $cells->length < 6)
                continue;

            $texts = [];
            foreach ($cells as $cell)
                $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));

            if (!preg_match('/^\d+$/', $texts[0]))
                continue;

            $standings[] = [
                'position' => (int)$texts[0],
                'team' => $texts[1] ?? '',
                'points' => isset($texts[2]) ? (int)$texts[2] : null,
                'played' => isset($texts[3]) ? (int)$texts[3] : null,
                'won' => isset($texts[4]) ? (int)$texts[4] : null,
                'lost' => isset($texts[5]) ? (int)$texts[5] : null,
                'is_our_team' => false,
            ];
        }
        return $standings;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** Internal: Upsert a championship. */

}
