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
        // Key lookup priority: getenv -> $_SERVER -> $_ENV -> AIConfig::GEMINI_TOKEN
        $apiKey = (getenv('GEMINI_TOKEN') ?: ($_SERVER['GEMINI_TOKEN'] ?? $_ENV['GEMINI_TOKEN'] ?? '')) ?: (class_exists(AIConfig::class) ? AIConfig::GEMINI_TOKEN : '');

        if (!$apiKey || trim($apiKey) === '') {
            $logMsg = date('Y-m-d H:i:s') . " [AI_SERVICE] CRITICAL: Gemini API Key not found in environment or AIConfig." . PHP_EOL;
            file_put_contents(__DIR__ . '/../ai_debug.log', $logMsg, FILE_APPEND);
            throw new \Exception('Chiave API Gemini non configurata. Verifica il file .env o AIConfig.php.');
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
        $cacertPath = __DIR__ . '/cacert.pem';
        
        $curlOptions = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 60,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ];

        if (file_exists($cacertPath)) {
            $curlOptions[CURLOPT_CAINFO] = $cacertPath;
        }

        curl_setopt_array($ch, $curlOptions);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        
        if ($response === false) {
            $logMsg = date('Y-m-d H:i:s') . " [AI_SERVICE] cURL error on model $model: $curlErr" . PHP_EOL;
            file_put_contents(__DIR__ . '/../ai_debug.log', $logMsg, FILE_APPEND);
            error_log('[AI_SERVICE] cURL error: ' . $curlErr);
            throw new \Exception('Errore di connessione AI: ' . $curlErr);
        }

        $responseData = json_decode($response, true);
        
        if ($httpCode !== 200 || empty($responseData)) {
            $keyUsed = substr($apiKey, 0, 8) . '...';
            $errMsg = $responseData['error']['message'] ?? 'Risposta non valida dall\'AI (HTTP ' . $httpCode . ')';
            
            // Detailed logging for debugging
            $logData = [
                'timestamp' => date('Y-m-d H:i:s'),
                'model' => $model,
                'key_prefix' => $keyUsed,
                'http_code' => $httpCode,
                'error' => $errMsg,
                'full_response' => $responseData
            ];
            
            file_put_contents(__DIR__ . '/../ai_debug.log', json_encode($logData) . PHP_EOL, FILE_APPEND);
            error_log('[AI_SERVICE] API error (' . $keyUsed . ') on model ' . $model . ': ' . $errMsg);
            
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
