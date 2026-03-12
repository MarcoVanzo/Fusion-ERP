<?php
/**
 * ValdService — API Client for VALD Hub
 * Fusion ERP v1.0
 *
 * API version: v2019q3 (ForceDecks External API)
 * Base URL: https://prd-euw-api-extforcedecks.valdperformance.com
 * Auth: OAuth2 Client Credentials via auth.prd.vald.com (March 2026 onwards)
 */

declare(strict_types=1);

namespace FusionERP\Modules\Vald;

class ValdService
{
    private string $clientId;
    private string $clientSecret;
    private string $orgId;
    private string $identityUrl;
    private string $apiBaseUrl;
    private ?string $accessToken = null;

    public function __construct()
    {
        $this->clientId = getenv('VALD_CLIENT_ID') ?: $_SERVER['VALD_CLIENT_ID'] ?? '';
        $this->clientSecret = getenv('VALD_CLIENT_SECRET') ?: $_SERVER['VALD_CLIENT_SECRET'] ?? '';
        $this->orgId = getenv('VALD_ORG_ID') ?: $_SERVER['VALD_ORG_ID'] ?? '';
        // New VALD API authentication URL (March 2026 onwards)
        $this->identityUrl = getenv('VALD_IDENTITY_URL') ?: $_SERVER['VALD_IDENTITY_URL'] ?? 'https://auth.prd.vald.com/oauth/token';
        // ForceDecks External API (EUW region — confirmed by VALD Support)
        $this->apiBaseUrl = getenv('VALD_API_BASE_URL') ?: $_SERVER['VALD_API_BASE_URL'] ?? 'https://prd-euw-api-extforcedecks.valdperformance.com';
    }

    /**
     * Get OAuth2 Access Token using Client Credentials flow.
     */
    private function getAccessToken(): string
    {
        if ($this->accessToken) {
            return $this->accessToken;
        }

        $ch = curl_init($this->identityUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'audience' => 'vald-api-external'
        ]));

        $response = curl_exec($ch);
        $data = json_decode($response ?: '', true);
        curl_close($ch);

        if (!isset($data['access_token'])) {
            throw new \Exception('Failed to obtain VALD Access Token: ' . ($data['error_description'] ?? $data['error'] ?? $response));
        }

        $this->accessToken = $data['access_token'];
        return $this->accessToken;
    }

    /**
     * Generic API Request.
     */
    private function request(string $method, string $endpoint, ?array $data = null)
    {
        $token = $this->getAccessToken();
        $url = $this->apiBaseUrl . $endpoint;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        $headers = [
            "Authorization: Bearer $token",
            "Content-Type: application/json",
            "Accept: application/json"
        ];

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            error_log("[VALD API] Error $httpCode on $url: $response");
            return null;
        }

        return json_decode($response ?: '', true);
    }

    /**
     * Fetch the list of Teams (Organisations) for this account.
     * Returns array of teams with their IDs and available links.
     */
    public function getTeams(): ?array
    {
        return $this->request('GET', '/v2019q3/teams');
    }

    /**
     * Fetch Athletes for a specific team.
     * @param string $teamId The VALD team ID (same as orgId for single-org accounts)
     * @param string $modifiedFrom Optional ISO date string to fetch only updated athletes
     */
    public function getAthletes(string $teamId = '', string $modifiedFrom = ''): ?array
    {
        if (!$teamId) {
            $teamId = $this->orgId;
        }
        $endpoint = "/v2019q3/teams/$teamId/athletes";
        if ($modifiedFrom) {
            $endpoint .= '?modifiedFrom=' . urlencode($modifiedFrom);
        }
        return $this->request('GET', $endpoint);
    }

    /**
     * @deprecated Use getAthletes() instead.
     * Kept for backward compatibility with the sync cron.
     */
    public function getProfiles(): ?array
    {
        $teams = $this->getTeams();
        if (empty($teams)) {
            return null;
        }
        $teamId = $teams[0]['id'] ?? $this->orgId;
        return $this->getAthletes($teamId);
    }

    /**
     * Fetch ForceDecks Test Results for a specific team.
     * @param string $modifiedSince Optional ISO date to fetch only new results
     * @param string $teamId Optional team ID (defaults to orgId)
     * @param int $page Page number (1-indexed)
     */
    public function getTestResults(string $modifiedSince = '', string $teamId = '', int $page = 1): ?array
    {
        if (!$teamId) {
            $teamId = $this->orgId;
        }

        if ($modifiedSince) {
            // Use the paginated endpoint with modifiedFrom filter
            $endpoint = '/v2019q3/teams/' . $teamId . '/tests/' . (string)$page;
            $endpoint .= '?modifiedFrom=' . urlencode($modifiedSince);
        } else {
            // Get tests for the last 90 days by default
            $dateTo = date('Y-m-d');
            $dateFrom = date('Y-m-d', strtotime('-90 days'));
            $endpoint = '/v2019q3/teams/' . $teamId . '/tests/' . $dateFrom . '/' . $dateTo . '/' . (string)$page;
        }

        $res = $this->request('GET', $endpoint);
        return $res['items'] ?? $res;
    }

    /**
     * Fetch an athlete's full test history.
     */
    public function getAthleteTests(string $athleteId, string $teamId = '', int $page = 1, string $modifiedFrom = ''): ?array
    {
        if (!$teamId) {
            $teamId = $this->orgId;
        }
        $endpoint = '/v2019q3/teams/' . $teamId . '/athlete/' . $athleteId . '/tests/' . (string)$page;
        if ($modifiedFrom) {
            $endpoint .= '?modifiedFrom=' . urlencode($modifiedFrom);
        }
        $res = $this->request('GET', $endpoint);
        return $res['items'] ?? $res;
    }

    /**
     * Fetch detailed trial results for a specific test.
     * Each trial contains the actual metrics (RSI, Jump Height, Peak Force, etc.)
     * with results broken down by limb (Trial, Left, Right).
     */
    public function getTrials(string $teamId, string $testId): ?array
    {
        if (!$teamId) {
            $teamId = $this->orgId;
        }
        $endpoint = "/v2019q3/teams/$teamId/tests/$testId/trials";
        return $this->request('GET', $endpoint);
    }
}