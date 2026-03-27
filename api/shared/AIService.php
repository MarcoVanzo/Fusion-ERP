<?php
declare(strict_types=1);

namespace FusionERP\Shared;

class AIService
{
    private const DEFAULT_MODEL = 'gemini-2.5-flash';
    private const API_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

    /**
     * @param string|array $prompt The text prompt or parts array to send to the model
     * @param array $options Optional generation config (temperature, maxOutputTokens, responseMimeType, etc.)
     * @param string $model The model name (defaults to gemini-2.5-flash)
     * @return string The text response from the model
     * @throws \Exception
     */
    public static function generateContent(string|array $prompt, array $options = [], string $model = self::DEFAULT_MODEL): string
    {
        $apiKey = $_ENV['GEMINI_TOKEN'] ?? $_SERVER['GEMINI_TOKEN'] ?? getenv('GEMINI_TOKEN') ?: '';
        if (empty($apiKey)) {
            throw new \Exception('Chiave API Gemini non configurata. Impostare GEMINI_TOKEN.');
        }

        $url = self::API_BASE_URL . $model . ':generateContent?key=' . $apiKey;

        $generationConfig = array_merge([
            'maxOutputTokens' => 8192,
            'temperature' => 0.3,
        ], $options);

        $parts = is_array($prompt) ? $prompt : [['text' => $prompt]];

        $payload = [
            'contents' => [
                ['parts' => $parts]
            ],
            'generationConfig' => $generationConfig,
            'safetySettings' => [
                ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_NONE'],
            ],
        ];

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 60,
            CURLOPT_CONNECTTIMEOUT => 10,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($response === false) {
            error_log('[AI_SERVICE] Curl error: ' . $curlError);
            throw new \Exception('Errore di connessione al servizio AI: ' . $curlError);
        }

        $responseData = json_decode($response, true);
        
        if ($httpCode !== 200 || empty($responseData)) {
            $keyUsed = substr($apiKey, 0, 8) . '...';
            $errMsg = $responseData['error']['message'] ?? 'Risposta non valida dall\'AI (HTTP ' . $httpCode . ')';
            error_log('[AI_SERVICE] API error (' . $keyUsed . '): ' . $response);
            throw new \Exception('Errore AI: ' . $errMsg);
        }

        return $responseData['candidates'][0]['content']['parts'][0]['text'] ?? '';
    }
    
    /**
     * Extracts JSON safely from a response string usually returned by LLMs.
     */
    public static function extractJson(string $text): ?array
    {
        $text = trim($text);
        if (preg_match('/```(?:json)?\s*(\{[\s\S]*\}|\[[\s\S]*\])\s*```/', $text, $matches)) {
            $text = $matches[1];
        } elseif (preg_match('/(\{[\s\S]*\}|\[[\s\S]*\])/', $text, $matches)) {
            $text = $matches[0];
        }
        
        return json_decode(trim($text), true);
    }
}
