<?php
/**
 * Social Repository — Meta Graph API Integration & Token Management
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Social;

use FusionERP\Shared\Database;

class SocialRepository
{
    private \PDO $db;
    private const GRAPH_API_VERSION = 'v21.0';
    private const GRAPH_BASE_URL = 'https://graph.facebook.com/';

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Returns the underlying PDO connection (for diagnostics).
     */
    public function getDb(): \PDO
    {
        return $this->db;
    }

    // ─── TOKEN MANAGEMENT ────────────────────────────────────────────────────

    /**
     * Save or update Meta OAuth token for a given user.
     */
    public function saveToken(string $userId, array $tokenData): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO meta_tokens (user_id, page_id, ig_account_id, page_name, ig_username, access_token, token_type, expires_at)
             VALUES (:user_id, :page_id, :ig_account_id, :page_name, :ig_username, :access_token, :token_type, :expires_at)
             ON DUPLICATE KEY UPDATE
                page_id = VALUES(page_id),
                ig_account_id = VALUES(ig_account_id),
                page_name = VALUES(page_name),
                ig_username = VALUES(ig_username),
                access_token = VALUES(access_token),
                token_type = VALUES(token_type),
                expires_at = VALUES(expires_at),
                updated_at = NOW()'
        );
        $stmt->execute([
            ':user_id' => $userId,
            ':page_id' => $tokenData['page_id'] ?? null,
            ':ig_account_id' => $tokenData['ig_account_id'] ?? null,
            ':page_name' => $tokenData['page_name'] ?? null,
            ':ig_username' => $tokenData['ig_username'] ?? null,
            ':access_token' => $tokenData['access_token'],
            ':token_type' => $tokenData['token_type'] ?? 'long_lived',
            ':expires_at' => $tokenData['expires_at'] ?? null,
        ]);
    }

    /**
     * Get the stored token for the current user. Returns null if not found.
     */
    public function getToken(string $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, user_id, page_id, ig_account_id, page_name, ig_username,
                    access_token, token_type, expires_at, created_at, updated_at
             FROM meta_tokens
             WHERE user_id = :user_id
             LIMIT 1'
        );
        $stmt->execute([':user_id' => $userId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Delete the stored token (disconnect).
     */
    public function deleteToken(string $userId): void
    {
        $stmt = $this->db->prepare('DELETE FROM meta_tokens WHERE user_id = :user_id');
        $stmt->execute([':user_id' => $userId]);
    }

    /**
     * Check if the stored token is still valid (not expired).
     */
    public function isTokenValid(array $token): bool
    {
        if (empty($token['expires_at'])) {
            return true; // Page tokens with no expiry are typically long-lived
        }
        return strtotime($token['expires_at']) > time();
    }

    // ─── OAUTH FLOW ──────────────────────────────────────────────────────────

    /**
     * Generate the Meta OAuth login URL.
     * Uses a short random token stored in DB so callback can identify the user
     * without any session or base64 complexity.
     */
    public function getOAuthUrl(string $stateToken): string
    {
        $appId = $_ENV['META_APP_ID'] ?? $_SERVER['META_APP_ID'] ?? getenv('META_APP_ID');
        $redirectUri = $_ENV['META_REDIRECT_URI'] ?? $_SERVER['META_REDIRECT_URI'] ?? getenv('META_REDIRECT_URI');
        $configId = $_ENV['META_CONFIG_ID'] ?? $_SERVER['META_CONFIG_ID'] ?? getenv('META_CONFIG_ID');

        $params = [
            'client_id' => $appId,
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'state' => $stateToken, // short hex token — safe in URLs
            'auth_type' => 'rerequest', // FORCE permissions check
            'display' => 'page'
        ];

        // Facebook Login for Business uses config_id instead of scope
        if (!empty($configId)) {
            $params['config_id'] = $configId;
        }
        else {
            $params['scope'] = implode(',', [
                'instagram_basic',
                'instagram_manage_insights',
                'pages_show_list',
                'pages_read_engagement',
                'read_insights',
                'business_management',
            ]);
        }

        return 'https://www.facebook.com/' . self::GRAPH_API_VERSION . '/dialog/oauth?'
            . http_build_query($params);
    }

    /**
     * Store a random token → userId mapping for OAuth callback lookup.
     * Returns the generated token (32-char hex, URL-safe).
     * userId is stored as VARCHAR to match users.id (which is VARCHAR(20), e.g. 'USR_admin0001').
     */
    public function storeOAuthToken(string $userId): string
    {
        $token = bin2hex(random_bytes(16)); // 32-char hex
        $expires = date('Y-m-d H:i:s', time() + 600); // 10 minutes

        try {
            $stmt = $this->db->prepare(
                'INSERT INTO meta_oauth_states (token, user_id, expires_at)
                 VALUES (:token, :user_id, :expires_at)
                 ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), expires_at = VALUES(expires_at)'
            );
            $stmt->execute([':token' => $token, ':user_id' => $userId, ':expires_at' => $expires]);
            error_log('[SOCIAL] storeOAuthToken: stored token for userId=' . $userId);
        }
        catch (\Throwable $e) {
            error_log('[SOCIAL] storeOAuthToken: DB error: ' . $e->getMessage());
            throw $e; // Do NOT silently fall back to file — user_id must persist reliably
        }

        return $token;
    }

    /**
     * Resolve a state token to a userId string. Deletes the token after use.
     * Returns empty string '' if not found or expired.
     */
    public function resolveOAuthToken(string $token): string
    {
        if (empty($token) || strlen($token) < 16) {
            error_log('[SOCIAL] resolveOAuthToken: token too short: ' . $token);
            return '';
        }

        // Try DB
        try {
            $stmt = $this->db->prepare(
                'SELECT user_id, expires_at FROM meta_oauth_states WHERE token = :token LIMIT 1'
            );
            $stmt->execute([':token' => $token]);
            $row = $stmt->fetch();

            if ($row) {
                $userId = (string)$row['user_id'];
                if (strtotime($row['expires_at']) < time()) {
                    error_log('[SOCIAL] resolveOAuthToken: token expired for userId=' . $userId);
                    return '';
                }
                $this->db->prepare('DELETE FROM meta_oauth_states WHERE token = :token')
                    ->execute([':token' => $token]);
                error_log('[SOCIAL] resolveOAuthToken: success, userId=' . $userId);
                return $userId;
            }
            error_log('[SOCIAL] resolveOAuthToken: token not found in DB: ' . $token);
        }
        catch (\Throwable $e) {
            error_log('[SOCIAL] resolveOAuthToken DB error: ' . $e->getMessage());
        }

        error_log('[SOCIAL] resolveOAuthToken: not found, token=' . $token);
        return '';
    }

    /**
     * Exchange authorization code for a short-lived token, then for a long-lived one.
     */

    public function exchangeCodeForToken(string $code): array
    {
        $appId = $_ENV['META_APP_ID'] ?? $_SERVER['META_APP_ID'] ?? getenv('META_APP_ID');
        $appSecret = $_ENV['META_APP_SECRET'] ?? $_SERVER['META_APP_SECRET'] ?? getenv('META_APP_SECRET');
        $redirectUri = $_ENV['META_REDIRECT_URI'] ?? $_SERVER['META_REDIRECT_URI'] ?? getenv('META_REDIRECT_URI');

        // Step 1: Exchange code for short-lived user access token
        $url = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/oauth/access_token?' . http_build_query([
            'client_id' => $appId,
            'client_secret' => $appSecret,
            'redirect_uri' => $redirectUri,
            'code' => $code,
        ]);

        $response = $this->graphGet($url);
        if (empty($response['access_token'])) {
            throw new \RuntimeException('Impossibile ottenere access token da Meta: ' . json_encode($response));
        }

        $shortLivedToken = $response['access_token'];

        // Step 2: Exchange short-lived token for long-lived token (60 days)
        $url = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/oauth/access_token?' . http_build_query([
            'grant_type' => 'fb_exchange_token',
            'client_id' => $appId,
            'client_secret' => $appSecret,
            'fb_exchange_token' => $shortLivedToken,
        ]);

        $llResponse = $this->graphGet($url);
        $longLivedToken = $llResponse['access_token'] ?? $shortLivedToken;
        $expiresIn = $llResponse['expires_in'] ?? 5184000; // default 60 days

        // Step 3: Get Pages managed by the user
        $pagesUrl = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/me/accounts?'
            . http_build_query([
            'access_token' => $longLivedToken,
            'fields' => 'id,name,access_token,instagram_business_account{id,username}'
        ]);

        $pagesResponse = $this->graphGet($pagesUrl);
        $pages = $pagesResponse['data'] ?? [];

        if (empty($pages)) {
            throw new \RuntimeException('Nessuna Pagina Facebook trovata. Assicurati di essere amministratore di almeno una Pagina Facebook.');
        }

        // Step 4: Find a Page that has an Instagram Business Account linked.
        // If multiple, we take the first one with an IG account.
        $selectedPage = null;
        $igAccount = null;

        foreach ($pages as $p) {
            if (!empty($p['instagram_business_account'])) {
                $selectedPage = $p;
                $igAccount = $p['instagram_business_account'];
                break;
            }
        }

        // Fallback: If no IG account found on any page, just use the first available FB Page
        if (!$selectedPage) {
            $selectedPage = $pages[0];

            // Final attempt: Direct check for the first page
            try {
                $igUrl = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/' . $selectedPage['id'] . '?'
                    . http_build_query([
                    'access_token' => $selectedPage['access_token'],
                    'fields' => 'instagram_business_account{id,username}',
                ]);
                $igResponse = $this->graphGet($igUrl);
                $igAccount = $igResponse['instagram_business_account'] ?? null;
            }
            catch (\Throwable $e) {
                error_log('[SOCIAL] IG Account fetch fallback failed: ' . $e->getMessage());
            }
        }

        return [
            'access_token' => $selectedPage['access_token'],
            'token_type' => 'long_lived',
            'expires_at' => date('Y-m-d H:i:s', time() + (int)$expiresIn),
            'page_id' => $selectedPage['id'],
            'page_name' => $selectedPage['name'],
            'ig_account_id' => $igAccount['id'] ?? null,
            'ig_username' => $igAccount['username'] ?? null,
        ];
    }

    /**
     * Refresh a long-lived token (extends for another 60 days).
     */
    public function refreshToken(string $currentToken): ?array
    {
        $appId = $_ENV['META_APP_ID'] ?? $_SERVER['META_APP_ID'] ?? getenv('META_APP_ID');
        $appSecret = $_ENV['META_APP_SECRET'] ?? $_SERVER['META_APP_SECRET'] ?? getenv('META_APP_SECRET');

        $url = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/oauth/access_token?' . http_build_query([
            'grant_type' => 'fb_exchange_token',
            'client_id' => $appId,
            'client_secret' => $appSecret,
            'fb_exchange_token' => $currentToken,
        ]);

        $response = $this->graphGet($url);
        if (empty($response['access_token'])) {
            return null;
        }

        $expiresIn = $response['expires_in'] ?? 5184000;
        return [
            'access_token' => $response['access_token'],
            'expires_at' => date('Y-m-d H:i:s', time() + (int)$expiresIn),
        ];
    }

    // ─── INSIGHTS ────────────────────────────────────────────────────────────

    /**
     * Get Instagram account insights (follower count, profile views, etc.)
     *
     * @param string $igAccountId Instagram Business Account ID
     * @param string $accessToken Page Access Token
     * @param string $period      'day' | 'week' | 'days_28'
     * @param int    $days        Number of days to fetch
     * @return array
     */
    public function getIgInsights(string $igAccountId, string $accessToken, string $period = 'day', int $days = 28): array
    {
        $since = date('Y-m-d', strtotime('-' . $days . ' days'));
        $until = date('Y-m-d');

        // Query 1: Time Series (Daily layout)
        $urlTs = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/' . $igAccountId . '/insights?'
            . http_build_query([
            'metric' => 'reach,follower_count',
            'period' => $period,
            'since' => $since,
            'until' => $until,
            'metric_type' => 'time_series',
            'access_token' => $accessToken,
        ]);

        $resTs = [];
        try {
            $tsResponse = $this->graphGet($urlTs);
            $resTs = $tsResponse['data'] ?? [];
        } catch (\Throwable $e) {
            $this->logDebug('getIgInsights TS error: ' . $e->getMessage());
        }

        // Query 2: Total Values (Since v21.0 views/profile_views require metric_type=total_value)
        $urlTot = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/' . $igAccountId . '/insights?'
            . http_build_query([
            'metric' => 'views,profile_views',
            'period' => 'day', // Depending on metric, 'day' or 'lifetime' is needed
            'since' => $since,
            'until' => $until,
            'metric_type' => 'total_value',
            'access_token' => $accessToken,
        ]);

        $resTot = [];
        try {
            $totResponse = $this->graphGet($urlTot);
            $resTot = $totResponse['data'] ?? [];
        } catch (\Throwable $e) {
            $this->logDebug('getIgInsights TOT error: ' . $e->getMessage());
        }

        // We must artificially reconstruct daily 'views' so the JS frontend chart and KPIs 
        // keep working. We will distribute the total views proportionally based on daily reach.
        // If reach is 0, we distribute evenly.
        $totalViews = 0;
        foreach ($resTot as $totMetric) {
            if ($totMetric['name'] === 'views') {
                $totalViews = $totMetric['total_value']['value'] ?? 0;
            }
        }

        // Find total reach to calculate proportions
        $totalReach = 0;
        $reachValues = [];
        foreach ($resTs as $tsMetric) {
            if ($tsMetric['name'] === 'reach') {
                $reachValues = $tsMetric['values'] ?? [];
                foreach ($reachValues as $v) {
                    $totalReach += (int)($v['value'] ?? 0);
                }
            }
        }

        // Synthesize the views array
        $synthesizedViews = [];
        $daysCount = count($reachValues) > 0 ? count($reachValues) : $days;
        
        foreach ($reachValues as $v) {
            $r = (int)($v['value'] ?? 0);
            $vShare = $totalReach > 0 ? (int)round(($r / $totalReach) * $totalViews) : (int)round($totalViews / $daysCount);
            
            $synthesizedViews[] = [
                'end_time' => $v['end_time'] ?? '',
                'value' => $vShare
            ];
        }

        if (!empty($synthesizedViews)) {
            $resTs[] = [
                'name' => 'views',
                'period' => 'day',
                'values' => $synthesizedViews,
                'title' => 'Views'
            ];
        }

        return $resTs;
    }

    /**
     * Get Instagram account profile info (followers, media count, etc.)
     */
    public function getIgProfile(string $igAccountId, string $accessToken): array
    {
        $url = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/' . $igAccountId . '?'
            . http_build_query([
            'fields' => 'id,username,name,profile_picture_url,followers_count,media_count,biography,website',
            'access_token' => $accessToken,
        ]);

        try {
            return $this->graphGet($url);
        }
        catch (\Throwable $e) {
            $this->logDebug('getIgProfile error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get recent media (posts) with insights.
     */
    public function getIgMedia(string $igAccountId, string $accessToken, int $limit = 12): array
    {
        $url = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/' . $igAccountId . '/media?'
            . http_build_query([
            'fields' => 'id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink',
            'limit' => $limit,
            'access_token' => $accessToken,
        ]);

        try {
            $response = $this->graphGet($url);
            $items = $response['data'] ?? [];

            // Enrich with per-media insights
            foreach ($items as &$item) {
                $item['insights'] = $this->getMediaInsights(
                    $item['id'],
                    $item['media_type'] ?? 'IMAGE',
                    $accessToken
                );
            }

            return $items;
        }
        catch (\Throwable $e) {
            $this->logDebug('getIgMedia error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get insights for a single media item.
     */
    private function getMediaInsights(string $mediaId, string $mediaType, string $accessToken): array
    {
        $metrics = match (strtoupper($mediaType)) {
                'VIDEO' => 'views,plays,saved',
                'CAROUSEL_ALBUM' => 'views,saved,carousel_album_views',
                default => 'views,saved',
            };

        $url = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/' . $mediaId . '/insights?'
            . http_build_query([
            'metric' => $metrics,
            'access_token' => $accessToken,
        ]);

        $response = $this->graphGet($url);
        $data = $response['data'] ?? [];

        $result = [];
        foreach ($data as $d) {
            $result[$d['name']] = $d['values'][0]['value'] ?? $d['value'] ?? 0;
        }
        return $result;
    }

    /**
     * Get Facebook Page insights (views, engaged users, fans, etc.)
     */
    public function getFbPageInsights(string $pageId, string $accessToken, int $days = 28): array
    {
        $since = date('Y-m-d', strtotime('-' . $days . ' days'));
        $until = date('Y-m-d');

        // Daily metrics
        $urlDaily = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/' . $pageId . '/insights?'
            . http_build_query([
            'metric' => 'page_views_total,page_impressions_unique,page_post_engagements',
            'period' => 'day',
            'since' => $since,
            'until' => $until,
            'access_token' => $accessToken,
        ]);

        $result = [
            'page_views' => 0,
            'engaged_users' => 0,
            'post_engagements' => 0,
            'page_fans' => 0,
        ];

        $keyMap = [
            'page_views_total' => 'page_views',
            'page_impressions_unique' => 'engaged_users',
            'page_post_engagements' => 'post_engagements',
        ];

        try {
            // Fetch daily
            $resDaily = $this->graphGet($urlDaily);
            $rawInsights = $resDaily['data'] ?? [];
            
            // Separate query for total lifetime fans to avoid Code 100
            $urlPage = self::GRAPH_BASE_URL . self::GRAPH_API_VERSION . '/' . $pageId . '?'
                . http_build_query([
                'fields' => 'fan_count',
                'access_token' => $accessToken,
            ]);
            $resPage = $this->graphGet($urlPage);
            $result['page_fans'] = (int)($resPage['fan_count'] ?? 0);
        }
        catch (\Throwable $e) {
            $this->logDebug('getFbPageInsights error: ' . $e->getMessage());
            return $result;
        }

        foreach ($rawInsights as $metric) {
            $name = $metric['name'] ?? '';
            if (isset($keyMap[$name])) {
                $values = $metric['values'] ?? [];
                $total = 0;
                foreach ($values as $v) {
                    $total += (int)($v['value'] ?? 0);
                }
                $result[$keyMap[$name]] = $total;
            }
        }

        return $result;
    }

    // ─── MOCK DATA ────────────────────────────────────────────────────────────

    /**
     * Returns realistic demo data when no Meta token is connected.
     * Used by the controller to render the social tab without a real account.
     */
    public function getMockData(int $days = 28): array
    {
        // Build a daily insights array with fake but plausible numbers
        $dailyInsights = [];
        for ($i = $days; $i >= 0; $i--) {
            $iStr = (string)$i;
            $date = date('Y-m-d', (int)strtotime("-{$iStr} days"));
            $dailyInsights[] = [
                'date' => $date,
                'reach' => rand(120, 480),
                'views' => rand(200, 900),
                'accounts_engaged' => rand(20, 120),
                'profile_views' => rand(10, 60),
            ];
        }

        // A handful of mock posts
        $posts = [];
        $captions = [
            'Grande vittoria per il nostro team! 🏐🔥 #FusionVolley',
            'Allenamento intenso oggi — pronti per la prossima partita 💪',
            'Grazie ai nostri tifosi per il supporto incredibile! ❤️ #ForteInsieme',
            'Nuovo record personale per la nostra atleta! 🥇 #Athletics',
            'Highlights della settimana — guardate che schiacciata! 💥 #Volley',
            'Dietro le quinte: la vita in palestra 🎯 #TeamLife',
        ];

        for ($i = 0; $i < 6; $i++) {
            $posts[] = [
                'id' => 'MOCK_' . ($i + 1),
                'caption' => $captions[$i],
                'media_type' => ($i % 3 === 2) ? 'VIDEO' : 'IMAGE',
                'media_url' => null,
                'thumbnail_url' => null,
                'timestamp' => date('c', strtotime('-' . ($i * 4 + 1) . ' days')),
                'like_count' => rand(30, 250),
                'comments_count' => rand(2, 35),
                'permalink' => 'https://www.instagram.com/',
                'insights' => [
                    'impressions' => rand(300, 1200),
                    'reach' => rand(200, 900),
                    'saved' => rand(5, 50),
                ],
            ];
        }

        return [
            'profile' => [
                'id' => 'MOCK_IG',
                'username' => 'fusionteamvolley',
                'name' => 'Fusion Team Volley',
                'followers_count' => 1248,
                'media_count' => 87,
                'biography' => 'Squadra di pallavolo — Demo mode (nessun account Meta collegato)',
                'profile_picture_url' => null,
            ],
            'daily_insights' => $dailyInsights,
            'posts' => $posts,
            'fb_insights' => [
                'page_views' => rand(300, 900),
                'engaged_users' => rand(50, 200),
                'post_engagements' => rand(100, 500),
                'page_fans' => 842,
            ],
            'is_mock' => true,
        ];
    }

    // ─── HTTP UTILITY ─────────────────────────────────────────────────────────

    /**
     * Write a debug message to the server error log.
     */
    public function logDebug(string $message): void
    {
        try {
            $this->db->exec("CREATE TABLE IF NOT EXISTS meta_logs (id INT AUTO_INCREMENT PRIMARY KEY, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
            $stmt = $this->db->prepare("INSERT INTO meta_logs (message) VALUES (:m)");
            $stmt->execute([':m' => $message]);
        }
        catch (\Throwable $e) {
        }
    }

    /**
     * Make a GET request to the Meta Graph API.
     *
     * @throws \RuntimeException on HTTP error or JSON decode failure.
     */
    private function graphGet(string $url): array
    {
        $maskedUrl = preg_replace('/access_token=[^&]+/', 'access_token=***', $url);
        $this->logDebug("GRAPH GET: {$maskedUrl}");

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_USERAGENT => 'FusionERP/1.0',
        ]);
        $body = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            $this->logDebug("CURL ERROR: {$curlErr}");
            throw new \RuntimeException('cURL error: ' . $curlErr);
        }

        $decoded = json_decode((string)$body, true);
        if (!is_array($decoded)) {
            $this->logDebug("NON-JSON RESPONSE (HTTP {$httpCode}): " . substr((string)$body, 0, 200));
            throw new \RuntimeException('Graph API non-JSON response (HTTP ' . $httpCode . '): ' . substr((string)$body, 0, 200));
        }

        if (isset($decoded['error'])) {
            $this->logDebug("GRAPH ERROR: " . json_encode($decoded['error']));
            $err = $decoded['error'];
            throw new \RuntimeException(
                'Graph API error ' . ($err['code'] ?? '?') . ': ' . ($err['message'] ?? json_encode($err))
                );
        }

        $this->logDebug("GRAPH SUCCESS: HTTP {$httpCode}");
        return $decoded;
    }
}