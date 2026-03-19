<?php
/**
 * JSON Response Helpers
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class Response
{
    /**
     * Send a successful JSON response and exit.
     */
    public static function success(mixed $data = null, int $httpCode = 200): never
    {
        http_response_code($httpCode);
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Cache-Control: post-check=0, pre-check=0', false);
        header('Pragma: no-cache');
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Send an error JSON response and exit.
     * Never exposes stack traces or DB internals.
     */
    public static function error(string $message, int $httpCode = 400, ?string $internalDetail = null): never
    {
        if ($internalDetail !== null) {
            $codeStr = (string)$httpCode;
            error_log("[API ERROR {$codeStr}] {$internalDetail}");
        }
        http_response_code($httpCode);
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Cache-Control: post-check=0, pre-check=0', false);
        header('Pragma: no-cache');
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['success' => false, 'error' => $message], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Validate required fields in a payload array.
     * Calls Response::error automatically if any field is missing or empty.
     *
     * @param array<string> $required  Field names
     */
    public static function requireFields(array $payload, array $required): void
    {
        foreach ($required as $field) {
            if (!isset($payload[$field]) || $payload[$field] === '') {
                self::error("Campo obbligatorio mancante: {$field}", 400);
            }
        }
    }

    /**
     * Parse JSON body from the incoming request.
     */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input');
        if (empty($raw)) {
            return [];
        }
        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            self::error('Body JSON non valido', 400);
        }
        return $decoded;
    }

    /**
     * Set CORS headers (restrict to app domain).
     */
    public static function setCorsHeaders(): void
    {
        $appUrl = getenv('APP_URL') ?: 'http://localhost';
        // CORS origin must be scheme+host+port only — paths are never part of an Origin header.
        $parsed = parse_url($appUrl);
        $allowedOrigin = ($parsed['scheme'] ?? 'http') . '://' . ($parsed['host'] ?? 'localhost');
        if (!empty($parsed['port'])) {
            $allowedOrigin .= ':' . $parsed['port'];
        }
        header("Access-Control-Allow-Origin: {$allowedOrigin}");
        header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
        header('Access-Control-Allow-Credentials: true');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}