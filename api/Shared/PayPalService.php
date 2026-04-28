<?php
/**
 * PayPal Service — REST API v2 wrapper (cURL, no SDK dependency)
 * Fusion ERP v1.0
 *
 * Handles OAuth2 authentication, order creation, and payment capture
 * via the PayPal Checkout Orders v2 API.
 *
 * @see https://developer.paypal.com/docs/api/orders/v2/
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class PayPalService
{
    private string $clientId;
    private string $clientSecret;
    private string $baseUrl;

    /** @var string|null Cached access token (valid ~9h, but per-request in PHP) */
    private ?string $accessToken = null;

    public function __construct()
    {
        $this->clientId     = trim((string)($_ENV['PAYPAL_CLIENT_ID']     ?? getenv('PAYPAL_CLIENT_ID')     ?: ''));
        $this->clientSecret = trim((string)($_ENV['PAYPAL_CLIENT_SECRET'] ?? getenv('PAYPAL_CLIENT_SECRET') ?: ''));
        $mode               = strtolower(trim((string)($_ENV['PAYPAL_MODE'] ?? getenv('PAYPAL_MODE') ?: 'sandbox')));

        $this->baseUrl = ($mode === 'live')
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        if (empty($this->clientId) || empty($this->clientSecret)) {
            throw new \RuntimeException('[PayPal] PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in .env');
        }
    }

    /**
     * Get the PayPal Client ID (safe to expose to frontend JS SDK).
     */
    public function getClientId(): string
    {
        return $this->clientId;
    }

    /**
     * Check if running in sandbox mode.
     */
    public function isSandbox(): bool
    {
        return str_contains($this->baseUrl, 'sandbox');
    }

    // ─── OAuth2 Access Token ────────────────────────────────────────────────────

    /**
     * Obtain an OAuth2 access token via client_credentials grant.
     *
     * @throws \RuntimeException on failure
     */
    private function getAccessToken(): string
    {
        if ($this->accessToken !== null) {
            return $this->accessToken;
        }

        $ch = curl_init($this->baseUrl . '/v1/oauth2/token');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => 'grant_type=client_credentials',
            CURLOPT_USERPWD        => $this->clientId . ':' . $this->clientSecret,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
            ],
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($response === false || !empty($curlErr)) {
            throw new \RuntimeException("[PayPal] OAuth2 cURL error: {$curlErr}");
        }

        if ($httpCode !== 200) {
            error_log("[PayPal] OAuth2 failed HTTP {$httpCode}: {$response}");
            throw new \RuntimeException("[PayPal] OAuth2 authentication failed (HTTP {$httpCode})");
        }

        $data = json_decode((string)$response, true);
        if (empty($data['access_token'])) {
            throw new \RuntimeException('[PayPal] OAuth2 response missing access_token');
        }

        $this->accessToken = $data['access_token'];
        return $this->accessToken;
    }

    // ─── Create Order ───────────────────────────────────────────────────────────

    /**
     * Create a PayPal Checkout order.
     *
     * @param float  $amount   Total amount in EUR
     * @param string $description Human-readable description
     * @param array  $metadata Custom metadata (stored in PayPal, returned on capture)
     * @return array{id: string, status: string, links: array}
     * @throws \RuntimeException on failure
     */
    public function createOrder(float $amount, string $description, array $metadata = []): array
    {
        $token = $this->getAccessToken();

        $body = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'description' => mb_substr($description, 0, 127),
                'amount' => [
                    'currency_code' => 'EUR',
                    'value'         => number_format($amount, 2, '.', ''),
                ],
                'custom_id' => json_encode($metadata),
            ]],
            'application_context' => [
                'brand_name'          => 'Fusion Team Volley',
                'locale'              => 'it-IT',
                'shipping_preference' => 'NO_SHIPPING',
                'user_action'         => 'PAY_NOW',
            ],
        ];

        $ch = curl_init($this->baseUrl . '/v2/checkout/orders');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($body),
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer ' . $token,
                'Prefer: return=representation',
            ],
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($response === false || !empty($curlErr)) {
            throw new \RuntimeException("[PayPal] createOrder cURL error: {$curlErr}");
        }

        $data = json_decode((string)$response, true);

        if ($httpCode < 200 || $httpCode >= 300) {
            $errMsg = $data['message'] ?? $data['error_description'] ?? $response;
            error_log("[PayPal] createOrder HTTP {$httpCode}: {$response}");
            throw new \RuntimeException("[PayPal] Errore creazione ordine: {$errMsg}");
        }

        if (empty($data['id'])) {
            throw new \RuntimeException('[PayPal] createOrder response missing order ID');
        }

        return $data;
    }

    // ─── Capture Order ──────────────────────────────────────────────────────────

    /**
     * Capture a previously approved PayPal order.
     *
     * @param string $orderId PayPal Order ID
     * @return array Full capture response from PayPal
     * @throws \RuntimeException on failure
     */
    public function captureOrder(string $orderId): array
    {
        $token = $this->getAccessToken();

        $ch = curl_init($this->baseUrl . '/v2/checkout/orders/' . urlencode($orderId) . '/capture');
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => '{}',
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Authorization: Bearer ' . $token,
                'Prefer: return=representation',
            ],
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($response === false || !empty($curlErr)) {
            throw new \RuntimeException("[PayPal] captureOrder cURL error: {$curlErr}");
        }

        $data = json_decode((string)$response, true);

        if ($httpCode < 200 || $httpCode >= 300) {
            $errMsg = $data['message'] ?? $data['error_description'] ?? $response;
            error_log("[PayPal] captureOrder HTTP {$httpCode}: {$response}");
            throw new \RuntimeException("[PayPal] Errore cattura pagamento: {$errMsg}");
        }

        return $data;
    }

    // ─── Get Order Details ──────────────────────────────────────────────────────

    /**
     * Retrieve order details (for verification).
     *
     * @param string $orderId PayPal Order ID
     * @return array Order details
     */
    public function getOrder(string $orderId): array
    {
        $token = $this->getAccessToken();

        $ch = curl_init($this->baseUrl . '/v2/checkout/orders/' . urlencode($orderId));
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPGET        => true,
            CURLOPT_HTTPHEADER     => [
                'Accept: application/json',
                'Authorization: Bearer ' . $token,
            ],
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode((string)$response, true);

        if ($httpCode !== 200 || empty($data)) {
            throw new \RuntimeException("[PayPal] getOrder failed HTTP {$httpCode}");
        }

        return $data;
    }
}
