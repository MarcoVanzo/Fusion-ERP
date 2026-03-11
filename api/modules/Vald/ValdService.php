<?php
/**
 * ValdService — API Client for VALD Hub
 * Fusion ERP v1.0
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
            "Content-Type: application/json"
        ];

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            error_log("[VALD API] Error $httpCode: $response");
            return null;
        }

        return json_decode($response ?: '', true);
    }

    /**
     * Fetch Athletes (Profiles) from VALD.
     */
    public function getProfiles(): ?array
    {
        // VALD External Profile API 
        // As of 2026, old PRD domains might be deprecated or behave differently.
        // We ensure we hit the correct externalprofile endpoint.
        $profileUrl = str_replace('extforcedecks', 'externalprofile', $this->apiBaseUrl);
        $endpoint = "/v1/profiles?organizationId=" . $this->orgId;

        // Temporarily override base URL for this call
        $originalBase = $this->apiBaseUrl;
        $this->apiBaseUrl = $profileUrl;
        $res = $this->request('GET', $endpoint);
        $this->apiBaseUrl = $originalBase;

        return $res;
    }

    /**
     * Fetch ForceDecks Test Results.
     */
    public function getTestResults(string $modifiedSince = ''): ?array
    {
        // VALD external test-results endpoint requires organizationId
        $endpoint = "/v1/test-results?organizationId=" . $this->orgId;
        if ($modifiedSince) {
            $endpoint .= "&modifiedSince=" . urlencode($modifiedSince);
        }

        return $this->request('GET', $endpoint);
    }
}