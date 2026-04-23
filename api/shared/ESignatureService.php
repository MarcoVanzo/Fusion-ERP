<?php
/**
 * Shared ESignature Service — Wrapper for OpenAPI.it EU-SES API
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class ESignatureService
{
    /**
     * Get the OpenAPI configuration from env
     */
    private static function getConfig(): array
    {
        return [
            'api_token' => getenv('OPENAPI_ESIGN_TOKEN') ?: '',
            'api_url' => getenv('OPENAPI_ESIGN_URL') ?: 'https://esignature.openapi.com',
        ];
    }

    /**
     * Send a base64 PDF for signature via OpenAPI.it
     */
    public static function sendForSignature(string $pdfBase64, array $signers, array $signaturePosition): array
    {
        $config = self::getConfig();

        if (empty($config['api_token'])) {
            return ['success' => false, 'error' => 'OPENAPI_ESIGN_TOKEN non configurato.'];
        }

        $url = rtrim($config['api_url'], '/') . '/api/v1/documents';

        $payload = [
            'document' => [
                'type' => 'base64',
                'content' => preg_replace('/^data:application\/pdf;base64,/', '', $pdfBase64)
            ],
            'signers' => $signers,
            'settings' => [
                'signature_type' => 'SES',
                'signature_placement' => $signaturePosition,
                'send_email' => false // We handle the email separately using PHPMailer
            ]
        ];

        return self::executeRequest('POST', $url, $config['api_token'], $payload);
    }

    /**
     * Get signature status
     */
    public static function getStatus(string $documentId): array
    {
        $config = self::getConfig();

        if (empty($config['api_token'])) {
            return ['success' => false, 'error' => 'API Token mancante.'];
        }

        $url = rtrim($config['api_url'], '/') . '/api/v1/documents/' . urlencode($documentId);
        
        $result = self::executeRequest('GET', $url, $config['api_token']);

        if ($result['success'] && isset($result['data']['state'])) {
            $state = strtoupper((string)$result['data']['state']);
            // OpenAPI often uses COMPLETED, DONE or SIGNED
            $isSigned = in_array($state, ['COMPLETED', 'DONE', 'SIGNED']);
            return [
                'success' => true,
                'status' => $state,
                'signed' => $isSigned,
                'data' => $result['data']
            ];
        }

        return $result;
    }

    /**
     * Download the signed document PDF from OpenAPI
     */
    public static function getSignedDocument(string $documentId): array
    {
        $config = self::getConfig();

        if (empty($config['api_token'])) {
            return ['success' => false, 'error' => 'API Token mancante.'];
        }

        $url = rtrim($config['api_url'], '/') . '/api/v1/documents/' . urlencode($documentId) . '/download';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPGET => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $config['api_token'],
                'Accept: application/pdf'
            ],
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errorStr = curl_error($ch);

        if ($response === false) {
            return ['success' => false, 'error' => 'CURL Error: ' . $errorStr];
        }

        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true, 'pdf_content' => $response];
        }

        $errDecoded = json_decode((string)$response, true);
        return [
            'success' => false,
            'error' => $errDecoded['message'] ?? 'HTTP Errore ' . $httpCode
        ];
    }

    /**
     * Helper to execute CURL requests
     */
    private static function executeRequest(string $method, string $url, string $token, ?array $payload = null): array
    {
        $ch = curl_init($url);
        
        $headers = [
            'Authorization: Bearer ' . $token,
            'Accept: application/json'
        ];

        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if ($payload) {
                $jsonData = json_encode($payload);
                curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
                $headers[] = 'Content-Type: application/json';
            }
        } else {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 25,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $errorStr = curl_error($ch);

        if ($response === false) {
            return ['success' => false, 'error' => 'CURL Error: ' . $errorStr, 'http_code' => 500];
        }

        $decoded = json_decode((string)$response, true);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return [
                'success' => true,
                'document_id' => $decoded['data']['id'] ?? ($decoded['id'] ?? null),
                'signing_url' => $decoded['data']['signing_url'] ?? ($decoded['signing_url'] ?? null),
                'data' => $decoded['data'] ?? $decoded,
            ];
        }

        return [
            'success' => false,
            'error' => $decoded['message'] ?? $decoded['error'] ?? 'HTTP Errore ' . $httpCode,
            'http_code' => $httpCode,
            'response' => $response
        ];
    }
}
