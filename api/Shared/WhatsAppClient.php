<?php
/**
 * WhatsApp Client — Meta Cloud API Integration
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class WhatsAppClient
{
    private string $token;
    private string $phoneNumberId;
    private string $apiUrl;
    public string $appSecret;

    public function __construct()
    {
        $this->token = $_ENV['WHATSAPP_TOKEN'] ?? '';
        $this->phoneNumberId = $_ENV['WHATSAPP_PHONE_NUMBER_ID'] ?? '';
        $this->appSecret = $_ENV['WHATSAPP_APP_SECRET'] ?? '';
        $this->apiUrl = "https://graph.facebook.com/v21.0/{$this->phoneNumberId}/messages";
    }

    /**
     * Send a template message.
     * 
     * @param string $to Recipient phone number in international format (e.g., 393470000000)
     * @param string $templateName Name of the approved template
     * @param string $languageCode e.g., 'it'
     * @param array $components Parameters for the template
     * @return array API response
     */
    public function sendTemplate(string $to, string $templateName, string $languageCode = 'it', array $components = []): array
    {
        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'template',
            'template' => [
                'name' => $templateName,
                'language' => ['code' => $languageCode],
                'components' => $components
            ]
        ];

        return $this->request($payload);
    }

    /**
     * Send a simple text message (requires 24h window).
     * 
     * @param string $to
     * @param string $text
     * @return array
     */
    public function sendText(string $to, string $text): array
    {
        $payload = [
            'messaging_product' => 'whatsapp',
            'to' => $to,
            'type' => 'text',
            'text' => ['body' => $text]
        ];

        return $this->request($payload);
    }

    /**
     * Mark an incoming message as read (sends read receipt — double blue ticks).
     *
     * @param string $messageId The wa_message_id received in the webhook payload
     * @return array API response
     */
    public function markAsRead(string $messageId): array
    {
        $payload = [
            'messaging_product' => 'whatsapp',
            'status' => 'read',
            'message_id' => $messageId,
        ];

        return $this->request($payload);
    }

    /**
     * Generic cURL request to Meta Graph API.
     */
    private function request(array $payload): array
    {
        if (empty($this->token) || empty($this->phoneNumberId) || str_starts_with($this->phoneNumberId, 'YOUR_')) {
            return [
                'success' => false,
                'error' => 'WhatsApp Cloud API not configured (WHATSAPP_PHONE_NUMBER_ID is missing or placeholder — check .env)'
            ];
        }

        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . $this->token,
            'Content-Type: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        $result = json_decode($response ?: '{}', true);

        if ($httpCode >= 200 && $httpCode < 300) {
            return ['success' => true, 'data' => $result];
        }

        return [
            'success' => false,
            'status' => $httpCode,
            'error' => $result['error']['message'] ?? 'Unknown API Error'
        ];
    }
}