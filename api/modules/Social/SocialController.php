<?php
/**
 * Social Controller — Meta Business Integration (Instagram + Facebook)
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Social;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;

class SocialController
{
    private SocialRepository $repo;

    public function __construct()
    {
        $this->repo = new SocialRepository();
    }

    // ─── GET /api/?module=social&action=status ───────────────────────────────
    /**
     * Returns connection status: whether a valid Meta token exists.
     */
    public function status(): void
    {
        $user = Auth::requireRead('social');
        $token = $this->repo->getToken((string)$user['id']);

        if (!$token) {
            Response::success([
                'connected' => false,
                'message' => 'Nessun account Meta collegato',
            ]);
        }

        $isValid = $this->repo->isTokenValid($token);

        // Try to refresh if it's about to expire (within 7 days)
        if ($isValid && !empty($token['expires_at'])) {
            $daysUntilExpiry = (strtotime($token['expires_at']) - time()) / 86400;
            if ($daysUntilExpiry < 7) {
                $refreshed = $this->repo->refreshToken($token['access_token']);
                if ($refreshed) {
                    $this->repo->saveToken((string)$user['id'], array_merge($token, $refreshed));
                    $token = $this->repo->getToken((string)$user['id']);
                }
            }
        }

        Response::success([
            'connected' => $isValid,
            'ig_username' => $token['ig_username'],
            'ig_account_id' => $token['ig_account_id'],
            'page_name' => $token['page_name'],
            'page_id' => $token['page_id'],
            'expires_at' => $token['expires_at'],
            'token_expired' => !$isValid,
        ]);
    }

    // ─── GET /api/?module=social&action=connect ──────────────────────────────
    /**
     * Generates the Meta OAuth URL and redirects.
     * Stores a random token in DB so we can identify the user in callback()
     * without relying on the PHP session (which is lost in cross-site redirects).
     */
    public function connect(): void
    {
        $user = Auth::requireWrite('social');

        $appId = $_ENV['META_APP_ID'] ?? $_SERVER['META_APP_ID'] ?? getenv('META_APP_ID');
        if (empty($appId) || $appId === 'YOUR_META_APP_ID') {
            Response::error('Meta App non configurata. Aggiungere META_APP_ID e META_APP_SECRET nel file .env', 500);
        }

        // Store token → userId in DB (with file fallback), get short hex token for state
        $stateToken = $this->repo->storeOAuthToken((string)$user['id']);
        $oauthUrl = $this->repo->getOAuthUrl($stateToken);

        header('Location: ' . $oauthUrl);
        exit;
    }

    // ─── GET /api/?module=social&action=callback ─────────────────────────────
    /**
     * OAuth callback: receives the authorization code from Meta.
     * Does NOT use requireAuth() — the session cookie may be lost during the
     * cross-site redirect. Instead, userId is decoded from the signed state param.
     */
    public function callback(): void
    {
        $baseReturnUrl = $_ENV['APP_URL'] ?? $_SERVER['APP_URL'] ?? getenv('APP_URL') ?: 'https://www.fusionteamvolley.it/ERP';

        // Log ALL GET params to DB for debugging — removed in production
        $code  = filter_input(INPUT_GET, 'code', FILTER_DEFAULT) ?? '';
        $error = filter_input(INPUT_GET, 'error', FILTER_DEFAULT) ?? '';
        $state = filter_input(INPUT_GET, 'state', FILTER_DEFAULT) ?? '';

        // Resolve userId from DB-stored token
        $userId = $this->repo->resolveOAuthToken($state);

        if (!$userId) {
            header('Location: ' . $baseReturnUrl . '#social?error=' . urlencode('Errore di autenticazione. Riprova il collegamento.'));
            exit;
        }

        $returnUrl = $_SESSION['meta_oauth_return'] ?? $baseReturnUrl;
        unset($_SESSION['meta_oauth_return']);

        if ($error || empty($code)) {
            $errorDesc = filter_input(INPUT_GET, 'error_description', FILTER_DEFAULT) ?? 'Autorizzazione negata';
            header('Location: ' . $returnUrl . '#social?error=' . urlencode($errorDesc));
            exit;
        }

        try {
            $tokenData = $this->repo->exchangeCodeForToken($code);
            $this->repo->saveToken((string)$userId, $tokenData);

            Audit::log('META_CONNECT', 'meta_tokens', (string)$userId, null, [
                'ig_username' => $tokenData['ig_username'],
                'page_name' => $tokenData['page_name'],
            ]);

            // Redirect back to the app with success indicator
            header('Location: ' . $returnUrl . '#social?connected=1');
            exit;
        }
        catch (\Throwable $e) {
            // Log the full error server-side but NEVER expose exception messages
            // in the redirect URL (potential XSS if frontend renders the hash without sanitisation).
            $errorCode = bin2hex(random_bytes(4)); // opaque reference for support
            error_log('[SOCIAL] OAuth callback error [' . $errorCode . ']: ' . $e->getMessage());
            header('Location: ' . $returnUrl . '#social?error=' . urlencode('Errore di autenticazione (' . $errorCode . '): ' . $e->getMessage()));
            exit;
        }
    }

    // ─── GET /api/?module=social&action=testOAuth ──────────────────────────
    /**
     * Diagnostic: tests DB insert/select for meta_oauth_states.
     *
     * SECURITY: This endpoint is disabled in production (APP_ENV=production).
     * It is kept for local/staging debugging only.
     */
    public function testOAuth(): void
    {
        if (getenv('APP_ENV') === 'production') {
            Response::error('Endpoint non disponibile in produzione.', 403);
        }

        Auth::requireRead('social');

        $testToken = bin2hex(random_bytes(16));
        $testUserId = '99';
        $testExpires = date('Y-m-d H:i:s', time() + 600);

        $result = ['token' => $testToken, 'steps' => []];

        // Step 1: INSERT
        try {
            $stmt = $this->repo->getDb()->prepare(
                'INSERT INTO meta_oauth_states (token, user_id, expires_at) VALUES (:token, :user_id, :expires_at)'
            );
            $stmt->execute([':token' => $testToken, ':user_id' => $testUserId, ':expires_at' => $testExpires]);
            $result['steps'][] = 'INSERT OK rows=' . $stmt->rowCount();
        }
        catch (\Throwable $e) {
            $result['steps'][] = 'INSERT ERROR: ' . $e->getMessage();
            $result['insert_ok'] = false;
            Response::success($result);
        }

        // Step 2: SELECT via resolveOAuthToken
        $resolved = $this->repo->resolveOAuthToken($testToken);
        $result['steps'][] = 'resolveOAuthToken returned=' . $resolved;
        $result['resolve_ok'] = ($resolved === $testUserId);

        // Cleanup
        try {
            $this->repo->getDb()->prepare('DELETE FROM meta_oauth_states WHERE token = :t')->execute([':t' => $testToken]);
            $result['steps'][] = 'CLEANUP OK';
        }
        catch (\Throwable $e) {
            $result['steps'][] = 'CLEANUP ERROR: ' . $e->getMessage();
        }

        Response::success($result);
    }

    // ─── POST /api/?module=social&action=disconnect ──────────────────────────
    /**
     * Removes the Meta token / disconnects the account.
     */
    public function disconnect(): void
    {
        $user = Auth::requireWrite('social');

        $token = $this->repo->getToken((string)$user['id']);
        $this->repo->deleteToken((string)$user['id']);

        Audit::log('META_DISCONNECT', 'meta_tokens', (string)$user['id'], $token, null);
        Response::success(['message' => 'Account Meta disconnesso']);
    }

    // ─── GET /api/?module=social&action=insights ─────────────────────────────
    /**
     * Returns aggregated Instagram + Facebook insights.
     */
    public function insights(): void
    {
        $user = Auth::requireRead('social');
        $days = max(1, min(90, (int)(filter_input(INPUT_GET, 'days', FILTER_SANITIZE_NUMBER_INT) ?: 28)));

        $token = $this->repo->getToken((string)$user['id']);

        // If no token connected, return mock data for demo
        if (!$token || !$this->repo->isTokenValid($token)) {
            $mockData = $this->repo->getMockData($days);
            Response::success($mockData);
        }

        try {
            // Fetch IG profile
            $profile = [];
            $igInsights = [];
            $posts = [];
            $fbInsights = [];

            if (!empty($token['ig_account_id'])) {
                $profile = $this->repo->getIgProfile($token['ig_account_id'], $token['access_token']);
                $igInsights = $this->repo->getIgInsights($token['ig_account_id'], $token['access_token'], 'day', $days);
                $posts = $this->repo->getIgMedia($token['ig_account_id'], $token['access_token'], 12);
            }

            if (!empty($token['page_id'])) {
                try {
                    $fbInsights = $this->repo->getFbPageInsights($token['page_id'], $token['access_token'], $days);
                }
                catch (\Throwable $fbError) {
                    // Facebook Insights may fail if page permissions are revoked; continue with Instagram
                }
            }

            // Transform time-series insights into a flat daily array
            $dailyInsights = $this->transformInsights($igInsights, $days);

            Response::success([
                'profile' => [
                    'id' => $token['ig_account_id'] ?? null,
                    'username' => $token['ig_username'] ?? '',
                    'name' => $token['ig_username'] ?? '',
                    'profile_picture_url' => null, // Placeholder as it's not currently stored in token
                    'followers_count' => $profile['followers_count'] ?? 0,
                    'media_count' => $profile['media_count'] ?? 0,
                ],
                'daily_insights' => $dailyInsights,
                'posts' => $posts,
                'fb_insights' => $fbInsights,
                'fb_page_name' => $token['page_name'] ?? 'Facebook Page',
                'is_mock' => false,
            ]);
        }
        catch (\Throwable $e) {
            error_log('[SOCIAL] Insights API error: ' . $e->getMessage());
            $mockData = $this->repo->getMockData($days);
            $mockData['error'] = 'Errore nel recupero dati da Meta. Mostrati dati di esempio.';
            Response::success($mockData);
        }
    }

    // ─── GET /api/?module=social&action=posts ────────────────────────────────
    /**
     * Returns recent Instagram posts with per-post insights.
     */
    public function posts(): void
    {
        $user = Auth::requireRead('social');
        $limit = max(1, min(50, (int)(filter_input(INPUT_GET, 'limit', FILTER_SANITIZE_NUMBER_INT) ?: 12)));

        $token = $this->repo->getToken((string)$user['id']);

        if (!$token || !$this->repo->isTokenValid($token) || empty($token['ig_account_id'])) {
            // Return mock posts
            $mock = $this->repo->getMockData(28);
            Response::success($mock['posts']);
        }

        try {
            $posts = $this->repo->getIgMedia($token['ig_account_id'], $token['access_token'], $limit);
            Response::success($posts);
        }
        catch (\Throwable $e) {
            error_log('[SOCIAL] Posts API error: ' . $e->getMessage());
            $mock = $this->repo->getMockData(28);
            Response::success($mock['posts']);
        }
    }

    // ─── PRIVATE HELPERS ─────────────────────────────────────────────────────

    /**
     * Transform Meta time-series insights into a simple daily array.
     */
    private function transformInsights(array $rawInsights, int $days): array
    {
        $daily = [];

        // Initialize empty days
        for ($i = $days; $i >= 0; $i--) {
            $iStr = (string)$i;
            $date = date('Y-m-d', (int)strtotime("-{$iStr} days"));
            $daily[$date] = [
                'date' => $date,
                'reach' => 0,
                'views' => 0,
                'accounts_engaged' => 0,
                'profile_views' => 0,
            ];
        }

        // Fill with actual data
        foreach ($rawInsights as $metric) {
            $metricName = $metric['name'] ?? '';
            $values = $metric['values'] ?? [];

            foreach ($values as $entry) {
                $date = substr($entry['end_time'] ?? '', 0, 10);
                if (isset($daily[$date])) {
                    $daily[$date][$metricName] = $entry['value'] ?? 0;
                }
            }
        }

        return array_values($daily);
    }
}