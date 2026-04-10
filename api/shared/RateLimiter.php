<?php
/**
 * RateLimiter — IP-based rate limiting for Fusion ERP
 * v1.0
 *
 * Uses the existing `login_attempts` pattern (file-based or DB-based)
 * to throttle requests. Designed for shared hosting (no Redis).
 *
 * Usage:
 *   RateLimiter::check($ip, 60, 60);   // 60 requests per 60 seconds
 *   RateLimiter::strict($ip);           // 5 per 15 min (login, password reset)
 *   RateLimiter::normal($ip);           // 60 per minute (standard API)
 *   RateLimiter::relaxed($ip);          // 120 per minute (read-heavy endpoints)
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class RateLimiter
{
    /**
     * Check whether a request from the given IP is within the rate limit.
     * Throws a 429 response if the limit is exceeded.
     *
     * Implementation: file-based sliding window counter.
     * Each IP gets a small file in sys_get_temp_dir() that tracks request timestamps.
     *
     * @param string $key      Unique key (typically IP address or IP+action)
     * @param int    $maxReq   Maximum requests allowed in the window
     * @param int    $windowSec Time window in seconds
     */
    public static function check(string $key, int $maxReq = 60, int $windowSec = 60): void
    {
        $safeKey = preg_replace('/[^a-zA-Z0-9_.\-]/', '_', $key);
        $file = sys_get_temp_dir() . DIRECTORY_SEPARATOR . "fusion_rl_{$safeKey}.json";

        $now = time();
        $timestamps = [];

        // Read existing timestamps
        if (file_exists($file)) {
            $raw = @file_get_contents($file);
            if ($raw !== false) {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    // Keep only timestamps within the current window
                    $timestamps = array_filter($decoded, fn($ts) => ($now - $ts) < $windowSec);
                }
            }
        }

        // Check limit
        if (count($timestamps) >= $maxReq) {
            $retryAfter = $windowSec - ($now - min($timestamps));
            header("Retry-After: {$retryAfter}");
            Response::error(
                "Troppe richieste. Riprova tra " . ceil($retryAfter / 60) . " minuti.",
                429
            );
            // Response::error exits, but just in case:
            return;
        }

        // Record this request
        $timestamps[] = $now;

        // Write back (atomic via temp file + rename)
        $tmpFile = $file . '.tmp.' . getmypid();
        @file_put_contents($tmpFile, json_encode(array_values($timestamps)), LOCK_EX);
        @rename($tmpFile, $file);
    }

    // ─── Convenience Profiles ────────────────────────────────────────────────

    /** Strict: 5 requests per 15 minutes. For login, password reset, etc. */
    public static function strict(string $ip): void
    {
        self::check($ip, 5, 900);
    }

    /** Normal: 60 requests per minute. Standard API endpoints. */
    public static function normal(string $ip): void
    {
        self::check($ip, 60, 60);
    }

    /** Relaxed: 120 requests per minute. Read-heavy/listing endpoints. */
    public static function relaxed(string $ip): void
    {
        self::check($ip, 120, 60);
    }
}
