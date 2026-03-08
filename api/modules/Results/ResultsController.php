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
use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;
use PDO;

class ResultsController
{
    private const BASE_URL = 'https://venezia.portalefipav.net';
    private const MOBILE_URL = self::BASE_URL . '/mobile/risultati.asp?menu=no';
    private const DESKTOP_URL = self::BASE_URL . '/risultati-classifiche.aspx?PId=7269';
    private const CACHE_TTL = 900; // 15 minutes

    // Highlight these team name fragments as "our team"
    private const OUR_TEAM_KEYWORDS = ['fusion', 'team volley', 'fusionteam'];

    /**
     * Portals that this controller can scrape/sync.
     * Used to validate user-provided URLs (must belong to at least one of these domains).
     */
    private const ALLOWED_DOMAINS = [
        'fipav', // venezia.portalefipav.net, fipavveneto.net, etc.
        'federvolley.it', // FIPAV national portal (B2, A1, A2…)
        'legavolley.it', // Lega Volley serie A
        'fipavonline.it', // Alternative FIPAV portal
    ];

    /**
     * Google Apps Script proxy URL — bypasses FIPAV WAF IP block on production server.
     * The GAS proxy fetches the FIPAV page from Google's IP and returns the raw HTML.
     * Set to null to disable and use direct cURL only.
     */
    private const GAS_PROXY_URL = 'https://script.google.com/macros/s/AKfycbzWEVIrWNDnKqP7U5lrL5pM2EMK_UuPMJoJHi5RIpnhJrx-r04MmWYixQoxV6TaAIU/exec';


    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api?module=results&action=getCampionati
     * Returns the list of championships available on the portal.
     */
    public function getCampionati(): void
    {
        Auth::requireRead('results');

        $pdo = Database::getInstance();
        $tenantId = TenantContext::id();

        // ── 1. Load from Database (federation_championships) ──────────────────
        try {
            $stmt = $pdo->prepare("
                SELECT * FROM federation_championships 
                WHERE tenant_id = :tid AND is_active = 1
                ORDER BY label ASC
            ");
            $stmt->execute([':tid' => $tenantId]);
            $campionati = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($campionati)) {
                Response::success([
                    'campionati' => $campionati,
                    'last_updated' => date('c'),
                    'source' => 'db'
                ]);
                return;
            }

            // ── 2. Fallback: load user-saved campionati from old JSON storage ─────
            $userSaved = $this->_loadUserCampionati();
            if (!empty($userSaved)) {
                // Migrating to DB...
                foreach ($userSaved as $c) {
                    $this->_upsertChampionship($c['id'], $c['label'], $c['url']);
                }
                // Re-fetch to confirm migration
                $stmt->execute([':tid' => $tenantId]);
                $campionati = $stmt->fetchAll(PDO::FETCH_ASSOC);
                Response::success(['campionati' => $campionati, 'last_updated' => date('c'), 'source' => 'db_migrated']);
                return;
            }

            // ── 3. Empty DB — return empty list (no scraping on load) ──────────
            Response::success([
                'campionati' => [],
                'last_updated' => date('c'),
                'source' => 'db'
            ]);
            return;

        }
        catch (\PDOException $e) {
            // Table may not exist yet (migration not applied). Self-heal by creating tables.
            // Note: PDOException->getCode() is 0 on MySQL; the SQLSTATE is in errorInfo[0].
            $sqlState = $e->errorInfo[0] ?? (string)$e->getCode();
            if ($sqlState === '42S02' || str_contains($e->getMessage(), "doesn't exist")) {
                error_log('[Results] federation_championships table missing, applying V037 migration...');
                $this->_applyFederationSyncMigration($pdo);
                // Return empty list — user can add campionati via the UI
                Response::success([
                    'campionati' => [],
                    'last_updated' => date('c'),
                    'source' => 'db'
                ]);
                return;
            }
            // Re-throw other PDO errors
            error_log('[Results] getCampionati PDOException: ' . $e->getMessage());
            Response::error('Errore database: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Apply V037 migration inline if the tables don't exist yet.
     * This is a self-healing fallback for servers where migrations haven't been applied.
     */
    private function _applyFederationSyncMigration(PDO $pdo): void
    {
        $sql = file_get_contents(dirname(__DIR__, 3) . '/db/migrations/V037__federation_sync.sql');
        if ($sql === false) {
            error_log('[Results] V037 migration SQL file not found.');
            return;
        }
        // Execute each statement separately (PDO doesn't support multi-statement exec)
        $errors = 0;
        foreach (array_filter(array_map('trim', explode(';', $sql))) as $statement) {
            if (!empty($statement)) {
                try {
                    $pdo->exec($statement);
                }
                catch (\PDOException $e2) {
                    $errors++;
                    error_log('[Results] Migration statement error: ' . $e2->getMessage());
                }
            }
        }
        if ($errors === 0) {
            error_log('[Results] V037 migration applied successfully.');
        }
        else {
            error_log('[Results] V037 migration applied with ' . (string)$errors . ' error(s). Check logs above.');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api?module=results&action=getResults&campionato_id=XYZ
     * Returns matches for a specific championship.
     */
    public function getResults(): void
    {
        Auth::requireRead('results');

        $campionatoId = trim((string)filter_input(INPUT_GET, 'campionato_id', FILTER_SANITIZE_SPECIAL_CHARS));
        $campionatoUrl = trim((string)filter_input(INPUT_GET, 'campionato_url', FILTER_SANITIZE_URL));

        if (empty($campionatoId) && empty($campionatoUrl)) {
            Response::error('Parametro campionato_id o campionato_url obbligatorio.', 400);
        }

        $pdo = Database::getInstance();
        $tenantId = TenantContext::id();

        // ── Check Database first ─────────────────────────────────────────────
        $stmt = $pdo->prepare("
            SELECT m.*, c.url as source_url, c.last_synced_at
            FROM federation_matches m
            JOIN federation_championships c ON m.championship_id = c.id
            WHERE c.id = :cid AND c.tenant_id = :tid
            ORDER BY m.match_date ASC
        ");
        $stmt->execute([':cid' => $campionatoId, ':tid' => $tenantId]);
        $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!empty($matches)) {
            // Adapt DB names to UI names if needed
            foreach ($matches as &$m) {
                $m['home'] = $m['home_team'];
                $m['away'] = $m['away_team'];
                $m['score'] = ($m['home_score'] !== null && $m['away_score'] !== null)
                    ? $m['home_score'] . ' - ' . $m['away_score']
                    : null;
                $m['sets_home'] = $m['home_score'];
                $m['sets_away'] = $m['away_score'];
                $m['date'] = $m['match_date'] ? date('d/m/Y', strtotime($m['match_date'])) : null;
                $m['time'] = $m['match_date'] ? date('H:i', strtotime($m['match_date'])) : null;
                $m['is_our_team'] = $this->_isOurTeam($m['home_team'], $m['away_team']);
            }

            Response::success([
                'matches' => $matches,
                'total' => count($matches),
                'last_updated' => $matches[0]['last_synced_at'],
                'source' => 'db',
                'source_url' => $matches[0]['source_url'],
            ]);
            return;
        }

        // ── No data in DB → ask user to sync first (no live scraping on load) ──
        Response::success([
            'matches' => [],
            'total' => 0,
            'needs_sync' => true,
            'last_updated' => null,
            'source' => 'db_empty',
        ]);
    }


    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET /api?module=results&action=getStandings&campionato_id=XYZ
     * Returns standings table for a championship.
     */
    public function getStandings(): void
    {
        Auth::requireRead('results');

        $campionatoId = trim((string)filter_input(INPUT_GET, 'campionato_id', FILTER_SANITIZE_SPECIAL_CHARS));
        $campionatoUrl = trim((string)filter_input(INPUT_GET, 'campionato_url', FILTER_SANITIZE_URL));

        if (empty($campionatoId) && empty($campionatoUrl)) {
            Response::error('Parametro campionato_id o campionato_url obbligatorio.', 400);
        }

        $pdo = Database::getInstance();
        $tenantId = TenantContext::id();

        // ── 1. Check Database first ─────────────────────────────────────────────
        try {
            $stmt = $pdo->prepare("
                SELECT s.*, c.last_synced_at
                FROM federation_standings s
                JOIN federation_championships c ON s.championship_id = c.id
                WHERE c.id = :cid AND c.tenant_id = :tid
                ORDER BY s.position ASC
            ");
            $stmt->execute([':cid' => $campionatoId, ':tid' => $tenantId]);
            $standings = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($standings)) {
                foreach ($standings as &$row) {
                    $row['is_our_team'] = $this->_isOurTeam($row['team'] ?? '');
                }
                Response::success([
                    'standings' => $standings,
                    'last_updated' => $standings[0]['last_synced_at'],
                    'source' => 'db'
                ]);
                return;
            }

            // ── 2. No standings in DB — check if championship was ever synced
            $champStmt = $pdo->prepare("SELECT last_synced_at FROM federation_championships WHERE id = :cid AND tenant_id = :tid");
            $champStmt->execute([':cid' => $campionatoId, ':tid' => $tenantId]);
            $champRow = $champStmt->fetch(PDO::FETCH_ASSOC);
            $lastSynced = $champRow['last_synced_at'] ?? null;

            // If never synced: ask to sync. If synced but standings empty: portal probably doesn't expose standings.
            Response::success([
                'standings' => [],
                'last_updated' => $lastSynced,
                'source' => 'db',
                'needs_sync' => true,
                'already_synced' => $lastSynced !== null,
            ]);
            return;

        }
        catch (\PDOException $e) {
            // Table may not exist yet — apply migration and return empty list.
            $sqlState = $e->errorInfo[0] ?? (string)$e->getCode();
            if ($sqlState === '42S02' || str_contains($e->getMessage(), "doesn't exist")) {
                error_log('[Results] federation_standings table missing, applying V037 migration...');
                $this->_applyFederationSyncMigration($pdo);
                Response::success([
                    'standings' => [],
                    'last_updated' => null,
                    'source' => 'db',
                    'needs_sync' => true,
                ]);
                return;
            }
            error_log('[Results] getStandings PDOException: ' . $e->getMessage());
            Response::error('Errore database: ' . $e->getMessage(), 500);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api?module=results&action=addCampionato
     * Save a custom championship entry to Database and sync it.
     */
    public function addCampionato(): void
    {
        Auth::requireWrite('results');

        $body = Response::jsonBody();
        $label = trim((string)($body['label'] ?? ''));
        $url = trim((string)($body['url'] ?? ''));

        if (empty($label) || empty($url)) {
            Response::error('Campi label e url obbligatori', 400);
        }
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            Response::error('URL non valido — inserire un URL completo (https://...)', 400);
        }
        // Accept any configured portal domain
        $urlLower = strtolower($url);
        $allowed = false;
        foreach (self::ALLOWED_DOMAINS as $domain) {
            if (str_contains($urlLower, $domain)) {
                $allowed = true;
                break;
            }
        }
        if (!$allowed) {
            Response::error(
                'URL non supportato. Portali accettati: venezia.portalefipav.net, fipavveneto.net, federvolley.it, legavolley.it',
                400
            );
        }

        $id = $this->_upsertChampionship(null, $label, $url);

        // Trigger immediate sync
        $this->_syncChampionshipData($id);

        Response::success(['id' => $id, 'message' => 'Campionato aggiunto e sincronizzato.']);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /**
     * POST /api?module=results&action=deleteCampionato&id=XYZ
     */
    public function deleteCampionato(): void
    {
        Auth::requireWrite('results');

        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS);
        if (!$id) {
            $body = Response::jsonBody();
            $id = $body['id'] ?? null;
        }

        if (!$id) {
            Response::error('id obbligatorio', 400);
        }

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("DELETE FROM federation_championships WHERE id = :id AND tenant_id = :tid");
        $stmt->execute([':id' => $id, ':tid' => TenantContext::id()]);

        if ($stmt->rowCount() === 0) {
            Response::error('Campionato non trovato', 404);
        }

        Response::success(['message' => 'Campionato eliminato']);
    }

    /**
     * GET /api?module=results&action=recentResults&limit=10
     *
     * PERF: Returns the last N played matches across ALL active championships
     * in a SINGLE SQL query. Replaces the N+1 pattern in dashboard.js
     * (getCampionati → N×getResults) with a single HTTP request.
     */
    public function recentResults(): void
    {
        Auth::requireRead('results');

        $pdo = Database::getInstance();
        $tenantId = TenantContext::id();
        $limit = max(1, min(50, (int)(filter_input(INPUT_GET, 'limit', FILTER_SANITIZE_NUMBER_INT) ?? 10)));

        try {
            $stmt = $pdo->prepare("
                SELECT
                    m.id, m.home_team AS home, m.away_team AS away,
                    m.home_score AS sets_home, m.away_score AS sets_away,
                    CONCAT(COALESCE(m.home_score,'?'),' - ',COALESCE(m.away_score,'?')) AS score,
                    DATE_FORMAT(m.match_date, '%d/%m/%Y') AS date,
                    DATE_FORMAT(m.match_date, '%H:%i')    AS time,
                    m.match_date,
                    m.status,
                    c.label AS championship_label,
                    c.id    AS championship_id
                FROM federation_matches m
                JOIN federation_championships c
                    ON m.championship_id = c.id
                   AND c.tenant_id = :tid
                   AND c.is_active  = 1
                WHERE m.status = 'played'
                  AND m.home_score IS NOT NULL
                  AND m.away_score IS NOT NULL
                ORDER BY m.match_date DESC
                LIMIT :lim
            ");
            $stmt->bindValue(':tid', $tenantId);
            $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Mark "our team" matches
            foreach ($matches as &$m) {
                $m['is_our_team'] = $this->_isOurTeam($m['home'], $m['away']);
            }

            Response::success([
                'matches' => $matches,
                'total' => count($matches),
                'last_updated' => date('c'),
                'source' => 'db',
            ]);
        }
        catch (\PDOException $e) {
            $sqlState = $e->errorInfo[0] ?? (string)$e->getCode();
            if ($sqlState === '42S02' || str_contains($e->getMessage(), "doesn't exist")) {
                Response::success(['matches' => [], 'total' => 0, 'source' => 'db']);
                return;
            }
            error_log('[Results] recentResults error: ' . $e->getMessage());
            Response::error('Errore database', 500);
        }
    }

    /**
     * GET /api?module=results&action=sync&id=XYZ
     */
    public function sync(): void
    {
        Auth::requireRead('results');

        // Store.api() sends params in the POST body (JSON) — read from there first,
        // then fall back to query string for direct GET links.
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS);
        if (!$id) {
            $body = (array)(json_decode((string)file_get_contents('php://input'), true) ?? []);
            $id = $body['id'] ?? null;
        }

        if (!$id) {
            Response::error('id campionato obbligatorio', 400);
        }

        $result = $this->_syncChampionshipData($id);
        Response::success($result);
    }

    // ─────────────────────────────────────────────────────────────────────────

    /** Load user-saved campionati from a JSON store on disk (per tenant). */
    private function _loadUserCampionati(): array
    {
        // Include tenant ID in the filename to prevent cross-tenant data merge (C3 fix)
        $tenantId = TenantContext::id();
        $safeId = preg_replace('/[^a-zA-Z0-9_]/', '_', $tenantId);
        $file = sys_get_temp_dir() . '/fusion_campionati_' . $safeId . '.json';

        // Also try legacy file (without tenant suffix) for backwards-compat migration
        if (!file_exists($file)) {
            $legacyFile = sys_get_temp_dir() . '/fusion_campionati.json';
            if (file_exists($legacyFile)) {
                error_log('[Results] Found legacy campionati file, migrating to tenant-scoped file: ' . $file);
                $file = $legacyFile;
            }
        }

        if (!file_exists($file))
            return [];
        $data = json_decode((string)file_get_contents($file), true);
        if (!is_array($data))
            return [];

        // Filter out corrupted URLs (like error messages saved by mistake)
        return array_values(array_filter($data, static function ($c) {
            return isset($c['url']) && str_starts_with(strtolower($c['url']), 'http');
        }));
    }


    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — HTTP
    // ─────────────────────────────────────────────────────────────────────────


    private function _fetch(string $url, string&$errorDetails = ''): ?string
    {
        // ── Try GAS Proxy first (bypasses FIPAV WAF IP block on production server) ──
        // BUT skip GAS proxy for fipavveneto.net because they block Google IPs and return 403
        if (self::GAS_PROXY_URL !== null && !str_contains($url, 'fipavveneto.net')) {
            $proxyUrl = self::GAS_PROXY_URL . '?url=' . urlencode($url);
            $ch = curl_init($proxyUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => 20,
                CURLOPT_CONNECTTIMEOUT => 8,
                CURLOPT_SSL_VERIFYPEER => false,
                CURLOPT_SSL_VERIFYHOST => 0,
            ]);
            $proxyHtml = curl_exec($ch);
            $proxyCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $proxyErr = curl_errno($ch);
            curl_close($ch);

            if ($proxyErr === 0 && $proxyCode >= 200 && $proxyCode < 300 && is_string($proxyHtml) && strlen($proxyHtml) > 500) {
                error_log("[Results] GAS proxy fetch OK for: {$url}");
                return $proxyHtml;
            }
            error_log("[Results] GAS proxy failed (HTTP " . (string)$proxyCode . ", cURL #" . (string)$proxyErr . "), falling back to direct cURL...");
        }

        // Realistic browser User-Agent (improves compatibility with portals that block bots)
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

        // Cookie jar for session handling (some portals require cookies)
        $cookieJar = sys_get_temp_dir() . '/fusion_fipav_cookies.txt';

        // Try with SSL verification first, fallback without if it fails
        $sslAttempts = [
            ['verify' => true, 'cainfo' => dirname(__DIR__, 2) . '/Shared/cacert.pem'],
            ['verify' => true, 'cainfo' => null], // Use system default CA bundle
            ['verify' => false, 'cainfo' => null], // Last resort: skip verification
        ];

        $html = false;
        $httpCode = 0;
        $curlError = '';
        $curlErrNo = 0;

        foreach ($sslAttempts as $idx => $sslConfig) {
            $ch = curl_init($url);
            $opts = [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_MAXREDIRS => 10,
                CURLOPT_TIMEOUT => 30,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_ENCODING => '', // Accept any encoding (auto-decode)
                CURLOPT_USERAGENT => $userAgent,
                CURLOPT_COOKIEJAR => $cookieJar,
                CURLOPT_COOKIEFILE => $cookieJar,
                CURLOPT_SSL_VERIFYPEER => $sslConfig['verify'],
                CURLOPT_SSL_VERIFYHOST => $sslConfig['verify'] ? 2 : 0,
                CURLOPT_HTTPHEADER => [
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language: it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding: gzip, deflate, br',
                    'Connection: keep-alive',
                    'Cache-Control: max-age=0',
                    'Sec-Ch-Ua: "Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                    'Sec-Ch-Ua-Mobile: ?0',
                    'Sec-Ch-Ua-Platform: "Windows"',
                    'Sec-Fetch-Dest: document',
                    'Sec-Fetch-Mode: navigate',
                    'Sec-Fetch-Site: none',
                    'Sec-Fetch-User: ?1',
                ],
            ];

            if ($sslConfig['cainfo'] !== null && file_exists($sslConfig['cainfo'])) {
                $opts[CURLOPT_CAINFO] = $sslConfig['cainfo'];
            }

            curl_setopt_array($ch, $opts);

            $html = curl_exec($ch);
            $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            $curlErrNo = curl_errno($ch);
            curl_close($ch);

            // If SSL-related error (codes 35, 51, 60, 77), try next SSL config
            if (in_array($curlErrNo, [35, 51, 60, 77], true) && $idx < count($sslAttempts) - 1) {
                error_log("[Results] SSL attempt #" . (string)$idx . " failed (cURL #" . (string)$curlErrNo . ": {$curlError}), trying fallback...");
                continue;
            }

            break; // Success or non-SSL error — stop retrying
        }

        if ($httpCode === 404 || $httpCode === 410) {
            error_log("[Results] Fetch returned HTTP " . (string)$httpCode . " for URL: {$url}");
            return ''; // Championship removed or doesn't exist anymore
        }

        if ($html === false || $curlErrNo !== 0 || $httpCode >= 400) {
            error_log("[Results] Direct fetch failed (HTTP " . (string)$httpCode . ", cURL #" . (string)$curlErrNo . "), trying AllOrigins fallback...");

            // Try AllOrigins public proxy as a fallback if direct connection is blocked by WAF
            $allOriginsUrl = 'https://api.allorigins.win/get?url=' . urlencode($url);
            $chProxy = curl_init($allOriginsUrl);
            curl_setopt_array($chProxy, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_TIMEOUT => 20,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_USERAGENT => $userAgent,
            ]);
            $proxyRes = curl_exec($chProxy);
            $proxyCode = (int)curl_getinfo($chProxy, CURLINFO_HTTP_CODE);
            $proxyErr = curl_errno($chProxy);
            curl_close($chProxy);

            if ($proxyErr === 0 && $proxyCode >= 200 && $proxyCode < 300 && is_string($proxyRes)) {
                $jsonData = json_decode($proxyRes, true);
                if (isset($jsonData['contents']) && is_string($jsonData['contents']) && strlen($jsonData['contents']) > 500) {
                    error_log("[Results] AllOrigins fallback OK for: {$url}");
                    return $jsonData['contents'];
                }
            }

            $hc = (string)$httpCode;
            $ce = (string)$curlErrNo;
            $errorDetails = "HTTP {$hc} | cURL #{$ce}: {$curlError}";
            error_log("[Results] Fetch completely failed: {$errorDetails} | URL: {$url}");
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
                preg_match('/GaraId=(\d+)/i', $href, $mId);
                $garaId = $mId[1] ?? null;

                $casaNodes = $xpath->query('.//*[contains(@class,"squadraCasa")]', $gara);
                $home = $casaNodes && $casaNodes->length > 0 ? trim(preg_replace('/\s+/', ' ', $casaNodes->item(0)->textContent)) : null;

                $ospiteNodes = $xpath->query('.//*[contains(@class,"squadraOspite")]', $gara);
                $away = $ospiteNodes && $ospiteNodes->length > 0 ? trim(preg_replace('/\s+/', ' ', $ospiteNodes->item(0)->textContent)) : null;

                if (empty($home) || empty($away))
                    continue;

                $match = [
                    'id' => $garaId, 'date' => null, 'time' => null,
                    'home' => $home, 'away' => $away,
                    'score' => null, 'sets_home' => null, 'sets_away' => null,
                    'status' => 'scheduled', 'round' => null, 'is_our_team' => false,
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
                    if (preg_match('/(\d{1,2}\/\d{1,2}\/\d{2,4})/', $dateText, $md))
                        $match['date'] = $md[1];
                    if (preg_match('/(\d{1,2}:\d{2})/', $dateText, $mt))
                        $match['time'] = $mt[1];
                }

                $matches[] = $match;
            }
            return $matches;
        }

        // FALLBACK: table-based layout
        $rows = $xpath->query('//table//tr[td]');
        if ($rows && $rows->length > 0) {
            foreach ($rows as $row) {
                /** @var \DOMElement $row */
                $cells = $xpath->query('td', $row);
                if (!$cells || $cells->length < 3)
                    continue;
                $texts = [];
                foreach ($cells as $cell)
                    $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));
                $match = $this->_extractMatchData($texts, $row, $xpath);
                if ($match !== null)
                    $matches[] = $match;
            }
        }

        return $matches;
    }

    /** Extract structured match data from table cells. */
    private function _extractMatchData(array $texts, \DOMElement $row, \DOMXPath $xpath): ?array
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
    private function _parseStandings(string $html): array
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
            $standings = $this->_parseStandingsRows($classifTables, $xpath);
            if (!empty($standings))
                return $standings;
        }

        // ── STRATEGY 3: Generic table rows — last resort ──
        $rows = $xpath->query('//table//tr[td]');
        if ($rows && $rows->length > 0)
            return $this->_parseStandingsRows($rows, $xpath);

        return [];
    }

    /** Extract standings from a set of table rows. */
    private function _parseStandingsRows(\DOMNodeList $rows, \DOMXPath $xpath): array
    {
        $standings = [];
        foreach ($rows as $row) {
            /** @var \DOMElement $row */
            $cells = $xpath->query('td', $row);
            if (!$cells || $cells->length < 3)
                continue;

            $texts = [];
            foreach ($cells as $cell)
                $texts[] = trim(preg_replace('/\s+/', ' ', $cell->textContent));

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
                'position' => null, 'team' => null,
                'played' => null, 'won' => null, 'lost' => null,
                'points' => null, 'is_our_team' => false,
            ];

            foreach ($texts as $i => $text) {
                $cleanText = trim(str_replace("\xc2\xa0", ' ', $text));
                if ($i === 0 && preg_match('/^\d+$/', $cleanText))
                    $entry['position'] = (int)$cleanText;
                elseif ($i === 1 && strlen($cleanText) > 2 && !preg_match('/^\d+$/', $cleanText))
                    $entry['team'] = $cleanText;
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
    private function _parseMatchesFipavVeneto(string $html): array
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
    private function _parseMatchesFedervolley(string $originalUrl, string $html): array
    {
        $p = $this->_extractFedervolleyApiParams($originalUrl);
        if ($p) {
            $matches = $this->_parseMatchesFedervolleyAPI($p);
            if (!empty($matches))
                return $matches;
            error_log('[Results] federvolley.it REST API returned 0 matches, falling back to HTML');
        }
        return $this->_parseMatchesFedervolleyHtml($html);
    }

    /**
     * Extract API params {base, serie, sesso, stagione, girone} from a federvolley.it URL.
     * Serie: B2, A1, A2... Sesso: M/F  Stagione: starting year (2025 for 2025-26)
     */
    private function _extractFedervolleyApiParams(string $url): ?array
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

        return compact('base', 'serie', 'sesso', 'stagione', 'girone');
    }

    /**
     * Fetch all matches using the official /live_score/* REST API.
     * Real JSON structure (verified March 2026):
     *   { "calendario": [ { "squadraA": { "name": "..." }, "squadraB": { "name": "..." },
     *     "risultato": { "A": { "status": "win|loose|", "points": 3 }, "B": {...} },
     *     "data_gara_short": "11/10/2025", "ora_gara": "20:30", "sets": [...] } ] }
     */
    private function _parseMatchesFedervolleyAPI(array $p): array
    {
        $base = $p['base'];
        $serie = $p['serie'];
        $sesso = $p['sesso'];
        $stagione = $p['stagione'];
        $girone = $p['girone'];

        // Discover girone if not set
        if (!$girone) {
            $err = '';
            $body = $this->_fetch("{$base}/live_score/giornate/{$serie}/{$sesso}/{$stagione}", $err);
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
        $giornateBody = $this->_fetch($giornateUrl, $err);
        $giornateData = $giornateBody ? json_decode($giornateBody, true) : null;
        if (!$giornateData) {
            error_log("[Results] federvolley.it REST: giornate fetch failed: {$err}");
            return [];
        }

        $ultimaGiocata = (int)($giornateData['ultimagiornata'] ?? 0);
        $totalGiornate = count($giornateData['giornate'] ?? []) ?: max($ultimaGiocata, 26);

        error_log("[Results] FV REST {$serie}/{$sesso}/{$stagione}/{$girone}: ultima={$ultimaGiocata}, tot={$totalGiornate}");

        $allMatches = [];
        // Fetch played + 1 upcoming round
        $limit = min($ultimaGiocata + 1, $totalGiornate);
        for ($g = 1; $g <= $limit; $g++) {
            $calUrl = "{$base}/live_score/live-score-calendario/{$serie}/{$sesso}/{$stagione}/{$girone}/{$g}";
            $calBody = $this->_fetch($calUrl, $err);
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
                    'score' => $played ? "{$setsHome} - {$setsAway}" : null,
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
     */
    private function _parseStandingsFedervolley(array $p, int $giornata): array
    {
        $base = $p['base'];
        $serie = $p['serie'];
        $sesso = $p['sesso'];
        $stagione = $p['stagione'];
        $girone = $p['girone'];

        $url = "{$base}/moduli/campionati/classifica/classifica.php"
            . "?serie={$serie}&sesso={$sesso}&stagione={$stagione}&giornata={$giornata}&girone={$girone}";

        $err = '';
        $html = $this->_fetch($url, $err);
        if (!$html) {
            error_log("[Results] federvolley.it classifica fetch failed: {$err}");
            return [];
        }

        $dom = new \DOMDocument();
        libxml_use_internal_errors(true);
        @$dom->loadHTML('<?xml encoding="UTF-8">' . $html);
        libxml_clear_errors();
        $xpath = new \DOMXPath($dom);

        $standings = [];
        // Try table rows
        $rows = $xpath->query('//table//tr[td]');
        if ($rows && $rows->length > 0) {
            foreach ($rows as $row) {
                $cells = $xpath->query('td', $row);
                if (!$cells || $cells->length < 2)
                    continue;
                $texts = [];
                foreach ($cells as $cell)
                    $texts[] = trim($cell->textContent);
                // Typical columns: pos, team, pg, v, p, punti
                $pos = (int)($texts[0] ?? 0);
                $team = trim($texts[1] ?? '');
                $pg = (int)($texts[2] ?? 0);
                $v = (int)($texts[3] ?? 0);
                $l = (int)($texts[4] ?? 0);
                $pts = (int)($texts[count($texts) - 1] ?? 0);
                if (!$team)
                    continue;
                $standings[] = [
                    'position' => $pos ?: count($standings) + 1,
                    'team' => $team,
                    'played' => $pg,
                    'won' => $v,
                    'lost' => $l,
                    'points' => $pts,
                    'is_our_team' => $this->_isOurTeam($team),
                ];
            }
        }

        error_log('[Results] federvolley.it classifica: ' . count($standings) . ' rows from ' . $url);
        return $standings;
    }

    /** Fallback: parse federvolley.it HTML calendar. */
    private function _parseMatchesFedervolleyHtml(string $html): array
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

    private function _parseStandingsFipavVeneto(string $html): array
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
    // PRIVATE — CACHE
    // ─────────────────────────────────────────────────────────────────────────

    private function _cacheFile(string $key): string
    {
        $cacheDir = __DIR__ . '/../../../../cache';
        if (!is_dir($cacheDir))
            @mkdir($cacheDir, 0755, true);
        return $cacheDir . '/fusion_results_' . md5($key) . '.json';
    }

    private function _getCache(string $key): ?array
    {
        $file = $this->_cacheFile($key);
        if (!file_exists($file) || (time() - filemtime($file)) > self::CACHE_TTL)
            return null;
        $decoded = json_decode((string)@file_get_contents($file), true);
        return is_array($decoded) ? $decoded : null;
    }

    private function _setCache(string $key, array $data): void
    {
        @file_put_contents($this->_cacheFile($key), json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE — HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /** Internal: Upsert a championship. */
    private function _upsertChampionship(?string $id, string $label, string $url): string
    {
        $pdo = Database::getInstance();
        $tenantId = TenantContext::id();
        if (!$id)
            $id = 'fed_' . substr(md5($url . $tenantId), 0, 8);
        $standingsUrl = $this->_getStandingsUrl($url);

        $stmt = $pdo->prepare("
            INSERT INTO federation_championships (id, tenant_id, label, url, standings_url)
            VALUES (:id, :tid, :label, :url, :surl)
            ON DUPLICATE KEY UPDATE label=VALUES(label), url=VALUES(url), standings_url=VALUES(standings_url)
        ");
        $stmt->execute([':id' => $id, ':tid' => $tenantId, ':label' => $label, ':url' => $url, ':surl' => $standingsUrl]);
        return $id;
    }

    /** Internal: Sync matches and standings. */
    private function _syncChampionshipData(string $id): array
    {
        $pdo = Database::getInstance();
        $tenantId = TenantContext::id();

        $stmt = $pdo->prepare("SELECT * FROM federation_championships WHERE id = :id AND tenant_id = :tid");
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        $champ = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$champ)
            return ['success' => false, 'error' => 'Not found'];

        $url = $champ['url'];

        $err = '';
        $htmlM = $this->_fetch($url, $err);

        if ($htmlM) {
            if (str_contains($url, 'fipavveneto.net')) {
                $matches = $this->_parseMatchesFipavVeneto($htmlM);
            }
            elseif (str_contains($url, 'federvolley.it')) {
                // Try JSON API first, fall back to HTML parsing
                $matches = $this->_parseMatchesFedervolley($url, $htmlM);
            }
            else {
                $matches = $this->_parseMatches($htmlM);
            }
        }
        else {
            $matches = [];
        }

        // ── Standings ─────────────────────────────────────────────────────────
        $standings = [];
        $standingsUrlUsed = null;

        if (str_contains($url, 'federvolley.it')) {
            $fvParams = $this->_extractFedervolleyApiParams($url);
            if ($fvParams && $fvParams['girone']) {
                $err = '';
                $giornateBody = $this->_fetch(
                    "{$fvParams['base']}/live_score/giornate/{$fvParams['serie']}/{$fvParams['sesso']}/{$fvParams['stagione']}/{$fvParams['girone']}",
                    $err
                );
                $giornateData = $giornateBody ? json_decode($giornateBody, true) : null;
                $ultimaGiocata = (int)($giornateData['ultimagiornata'] ?? 1);
                $standings = $this->_parseStandingsFedervolley($fvParams, $ultimaGiocata);
                $g = (string)$ultimaGiocata;
                $standingsUrlUsed = "{$fvParams['base']}/moduli/campionati/classifica/classifica.php"
                    . "?serie={$fvParams['serie']}&sesso={$fvParams['sesso']}&stagione={$fvParams['stagione']}"
                    . "&giornata={$g}&girone={$fvParams['girone']}";
            }
        }
        else {
            $candidateUrls = $this->_getStandingsUrlCandidates($url);
            if (!empty($champ['standings_url']) && !in_array($champ['standings_url'], $candidateUrls, true)) {
                array_unshift($candidateUrls, $champ['standings_url']);
            }
            foreach ($candidateUrls as $sUrl) {
                $htmlS = $this->_fetch($sUrl, $err);
                if (!$htmlS)
                    continue;
                $parsed = str_contains($sUrl, 'fipavveneto.net')
                    ? $this->_parseStandingsFipavVeneto($htmlS)
                    : $this->_parseStandings($htmlS);
                error_log("[Results] Standings candidate {$sUrl} → " . count($parsed) . ' entries');
                if (!empty($parsed)) {
                    $standings = $parsed;
                    $standingsUrlUsed = $sUrl;
                    break;
                }
            }
        }


        try {
            $pdo->beginTransaction();
            $pdo->prepare("DELETE FROM federation_matches WHERE championship_id = :cid")->execute([':cid' => $id]);
            $insM = $pdo->prepare("INSERT INTO federation_matches (id, championship_id, match_number, match_date, home_team, away_team, home_score, away_score, status) VALUES (:id, :cid, :num, :date, :home, :away, :hs, :as, :status)");
            foreach ($matches as $m) {
                $sqlDate = null;
                if (!empty($m['date'])) {
                    $d = str_replace('/', '-', $m['date']) . (empty($m['time']) ? '' : ' ' . $m['time']);
                    $ts = strtotime($d);
                    if ($ts)
                        $sqlDate = date('Y-m-d H:i:s', $ts);
                }
                $insM->execute([':id' => 'm_' . substr(md5($id . ($m['id'] ?? uniqid())), 0, 10), ':cid' => $id, ':num' => $m['id'] ?? null, ':date' => $sqlDate, ':home' => $m['home'], ':away' => $m['away'], ':hs' => $m['sets_home'], ':as' => $m['sets_away'], ':status' => $m['status']]);
            }

            $pdo->prepare("DELETE FROM federation_standings WHERE championship_id = :cid")->execute([':cid' => $id]);
            $insS = $pdo->prepare("INSERT INTO federation_standings (id, championship_id, position, team, points, played, won, lost) VALUES (:id, :cid, :pos, :team, :pts, :p, :w, :l)");
            foreach ($standings as $s) {
                $insS->execute([':id' => 's_' . substr(md5($id . $s['team']), 0, 10), ':cid' => $id, ':pos' => $s['position'], ':team' => $s['team'], ':pts' => $s['points'] ?? 0, ':p' => $s['played'] ?? 0, ':w' => $s['won'] ?? 0, ':l' => $s['lost'] ?? 0]);
            }

            // Update last_synced_at and save the winning standings_url for future syncs
            $upd = $pdo->prepare("UPDATE federation_championships SET last_synced_at = NOW(), standings_url = COALESCE(:surl, standings_url) WHERE id = :id");
            $upd->execute([':id' => $id, ':surl' => $standingsUrlUsed]);
            $pdo->commit();
            return ['success' => true, 'matches' => count($matches), 'standings' => count($standings), 'standings_url' => $standingsUrlUsed];
        }
        catch (\Exception $e) {
            $pdo->rollBack();
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    /** Get standings URL from match URL. Returns the best candidate URL for standings. */
    private function _getStandingsUrl(string $url): string
    {
        // federvolley.it — standings via classifica page
        if (str_contains($url, 'federvolley.it')) {
            // Try to replace calendario/results page with classifica page
            if (str_contains($url, 'calendario'))
                return str_replace('calendario', 'classifica', $url);
            return $url . (str_contains($url, '?') ? '&' : '?') . 'view=classifica';
        }

        // Desktop: risultati-classifiche.aspx?...CId=XXX → /classifica.aspx?CId=XXX
        if (str_contains($url, 'risultati-classifiche.aspx') && preg_match('/[?&]CId=(\d+)/i', $url, $m))
            return self::BASE_URL . '/classifica.aspx?CId=' . $m[1];

        // Desktop: .aspx result pages → .aspx classification page
        if (str_contains($url, 'risultati.aspx'))
            return str_replace('risultati.aspx', 'classifiche.aspx', $url);

        // Generic campionato URL replacement
        if (str_contains($url, 'calendari-gare'))
            return str_replace('calendari-gare', 'classifiche', $url);

        // FIPAV Venezia mobile: /mobile/risultati.asp?CampionatoId=XXX
        // → /mobile/classifiche.asp?CampionatoId=XXX (correct mobile standings page)
        if (str_contains($url, '/mobile/risultati.asp') && preg_match('/[?&]CampionatoId=([^&]+)/i', $url, $m))
            return self::BASE_URL . '/mobile/classifiche.asp?CampionatoId=' . $m[1];

        // Fallback: &vis=classifica (often broken, kept as last resort)
        return $url . (str_contains($url, '?') ? '&' : '?') . 'vis=classifica';
    }

    /**
     * Returns a list of standings URL candidates (most specific first) to try during sync.
     * The first URL that returns a non-empty standings list wins.
     */
    private function _getStandingsUrlCandidates(string $matchUrl): array
    {
        $candidates = [];

        // Try mobile classifiche.asp first (most reliable for FIPAV Venezia)
        if (preg_match('/[?&]CampionatoId=([^&]+)/i', $matchUrl, $m)) {
            $cid = $m[1];
            $candidates[] = self::BASE_URL . '/mobile/classifiche.asp?CampionatoId=' . $cid;
            $candidates[] = self::BASE_URL . '/mobile/risultati.asp?CampionatoId=' . $cid . '&vis=classifica';
        }

        // Desktop pattern
        if (preg_match('/[?&]CId=(\d+)/i', $matchUrl, $m)) {
            $candidates[] = self::BASE_URL . '/classifica.aspx?CId=' . $m[1];
        }

        // Generic fallback
        $fallback = $this->_getStandingsUrl($matchUrl);
        if (!in_array($fallback, $candidates))
            $candidates[] = $fallback;

        return array_unique($candidates);
    }

    private function _isOurTeam(string...$names): bool
    {
        foreach ($names as $name) {
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
}