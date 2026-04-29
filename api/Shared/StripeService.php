<?php
/**
 * Stripe Service — REST API wrapper (cURL, no SDK dependency)
 * Fusion ERP v1.0
 *
 * Handles PaymentIntent creation and confirmation via the Stripe API.
 * Mirrors the PayPalService pattern using raw cURL calls.
 *
 * @see https://docs.stripe.com/api/payment_intents
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class StripeService
{
    private string $secretKey;
    private string $publishableKey;
    private const BASE_URL = 'https://api.stripe.com/v1';

    public function __construct()
    {
        $this->secretKey      = trim((string)($_ENV['STRIPE_SECRET_KEY']      ?? getenv('STRIPE_SECRET_KEY')      ?: ''));
        $this->publishableKey = trim((string)($_ENV['STRIPE_PUBLISHABLE_KEY'] ?? getenv('STRIPE_PUBLISHABLE_KEY') ?: ''));

        if (empty($this->secretKey) || empty($this->publishableKey)) {
            throw new \RuntimeException('[Stripe] STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY must be set in .env');
        }
    }

    /**
     * Get publishable key (safe for frontend).
     */
    public function getPublishableKey(): string
    {
        return $this->publishableKey;
    }

    /**
     * Create a PaymentIntent.
     *
     * @param float  $amount      Amount in EUR
     * @param string $description Human-readable description
     * @param array  $metadata    Key-value metadata
     * @return array{id: string, client_secret: string, status: string}
     */
    public function createPaymentIntent(float $amount, string $description, array $metadata = []): array
    {
        $params = [
            'amount'               => (int)round($amount * 100), // Stripe uses cents
            'currency'             => 'eur',
            'description'          => mb_substr($description, 0, 500),
            'payment_method_types[0]' => 'card',
            'payment_method_types[1]' => 'klarna',
        ];

        // Add metadata
        foreach ($metadata as $k => $v) {
            $params["metadata[{$k}]"] = (string)$v;
        }

        return $this->request('POST', '/payment_intents', $params);
    }

    /**
     * Retrieve a PaymentIntent to check its status.
     *
     * @param string $intentId Stripe PaymentIntent ID (pi_xxx)
     * @return array Full PaymentIntent object
     */
    public function getPaymentIntent(string $intentId): array
    {
        return $this->request('GET', '/payment_intents/' . urlencode($intentId));
    }

    /**
     * Generic Stripe API request via cURL.
     *
     * @param string $method HTTP method
     * @param string $path   API path (e.g. /payment_intents)
     * @param array  $params Form-encoded params (for POST)
     * @return array Decoded JSON response
     */
    private function request(string $method, string $path, array $params = []): array
    {
        $url = self::BASE_URL . $path;

        $ch = curl_init();
        $opts = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->secretKey,
            ],
            CURLOPT_TIMEOUT        => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
        ];

        if ($method === 'POST') {
            $opts[CURLOPT_POST]       = true;
            $opts[CURLOPT_POSTFIELDS] = http_build_query($params);
            $opts[CURLOPT_URL]        = $url;
        } else {
            $opts[CURLOPT_HTTPGET] = true;
            $opts[CURLOPT_URL]    = $url . (!empty($params) ? '?' . http_build_query($params) : '');
        }

        curl_setopt_array($ch, $opts);

        $response = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($response === false || !empty($curlErr)) {
            throw new \RuntimeException("[Stripe] cURL error: {$curlErr}");
        }

        $data = json_decode((string)$response, true);

        if ($httpCode < 200 || $httpCode >= 300) {
            $errMsg = $data['error']['message'] ?? $response;
            error_log("[Stripe] API error HTTP {$httpCode}: {$response}");
            throw new \RuntimeException("[Stripe] {$errMsg}");
        }

        return $data ?? [];
    }
}
