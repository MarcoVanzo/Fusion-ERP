<?php
/**
 * Fipav Scraper Client
 * Handles HTTP requests and parsing to Federation websites.
 * Extracted from ResultsController.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Results;

use FusionERP\Shared\TenantContext;

class FipavScraperClient
{
    const BASE_URL = 'https://venezia.portalefipav.net';

    /** Costanti per API e domini e property proxy */
    const ALLOWED_DOMAINS = [
        'portalefipav.net',
        'fipavveneto.net',
        'fipavonline.it',
        'federvolley.it',
        'corsproxy.io'
    ];

    private string $gasProxyUrl = 'https://script.google.com/macros/s/AKfycbyTnt-3_D9uJgYl1I1n9eH3f6Vl6-L9Z8H1R0Jz_mKkE_1JvG1xK2G5X5W5l1p1s-/exec';

    public function __construct()
    {
    }

    public function fetch(string $url, string&$errorDetails = ''): ?string
    {
        // ── Try GAS Proxy first (bypasses FIPAV WAF IP block on production server) ──
        // BUT skip GAS proxy for fipavveneto.net because they block Google IPs and return 403
        if (!str_contains($url, 'fipavveneto.net')) {
            $proxyUrl = $this->gasProxyUrl . '?url=' . urlencode($url);
            $ch = curl_init($proxyUrl);
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => true,
                CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
                CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
                CURLOPT_TIMEOUT => 20,
                CURLOPT_CONNECTTIMEOUT => 8,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
            ]);
            $proxyHtml = curl_exec($ch);
            $proxyCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $proxyErr = curl_errno($ch);
            curl_close($ch);

            if ($proxyErr === 0 && $proxyCode >= 200 && $proxyCode < 300 && is_string($proxyHtml) && strlen($proxyHtml) > 500) {
                error_log("[Results] GAS proxy fetch OK for: {$url}");
                return $proxyHtml;
            }
            error_log("[Results] GAS proxy failed (HTTP " . (string)$proxyCode . ", cURL #" . (string)$proxyErr . "), falling back to direct cURL...");
        }

        // Realistic browser User-Agent (improves compatibility with portals that block bots)
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

        // Check if URL is an allowed domain for SSRF mitigation
        $isAllowedDomain = false;
        $parsedHost = parse_url($url, PHP_URL_HOST) ?? '';
        foreach (self::ALLOWED_DOMAINS as $domain) {
            if ($parsedHost === $domain || str_ends_with($parsedHost, '.' . $domain)) {
                $isAllowedDomain = true;
                break;
            }
        }

        // Cookie jar for session handling (some portals require cookies)
        $cookieJar = sys_get_temp_dir() . '/fusion_fipav_cookies.txt';

        // Try with SSL verification first, fallback without if it fails
        $sslAttempts = [
            ['verify' => true, 'cainfo' => dirname(__DIR__, 2) . '/Shared/cacert.pem'],
            ['verify' => true, 'cainfo' => null], // Use system default CA bundle
            // OWASP A02:2021 - Removed insecure fallback (verify => false)
        ];

        $html = false;
        $httpCode = 0;
        $curlError = '';
        $curlErrNo = 0;

        foreach ($sslAttempts as $idx => $sslConfig) {
            $ch = curl_init($url);
            $opts = [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_FOLLOWLOCATION => $isAllowedDomain,
                CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
                CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
                CURLOPT_MAXREDIRS => 5,
                CURLOPT_TIMEOUT => 15,
                CURLOPT_CONNECTTIMEOUT => 5,
                CURLOPT_ENCODING => '', // Accept any encoding (auto-decode)
                CURLOPT_USERAGENT => $userAgent,
                CURLOPT_COOKIEJAR => $cookieJar,
                CURLOPT_COOKIEFILE => $cookieJar,
                CURLOPT_SSL_VERIFYPEER => true,
                CURLOPT_SSL_VERIFYHOST => 2,
                CURLOPT_HTTPHEADER => [
                    'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language: it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7',
                    'Accept-Encoding: gzip, deflate, br',
                    'Connection: keep-alive',
                    'Cache-Control: max-age=0',
                    'Sec-Ch-Ua: "Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
                    'Sec-Ch-Ua-Mobile: ?0',
                    'Sec-Ch-Ua-Platform: "Windows"',
                    'Sec-Fetch-Dest: document',
                    'Sec-Fetch-Mode: navigate',
                    'Sec-Fetch-Site: none',
                    'Sec-Fetch-User: ?1',
                ],
            ];

            if ($sslConfig['cainfo'] !== null && file_exists($sslConfig['cainfo'])) {
                $opts[CURLOPT_CAINFO] = $sslConfig['cainfo'];
            }

            curl_setopt_array($ch, $opts);

            $html = curl_exec($ch);
            $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $curlError = curl_error($ch);
            $curlErrNo = curl_errno($ch);
            curl_close($ch);

            // If SSL-related error (codes 35, 51, 60, 77), try next SSL config
            if (in_array($curlErrNo, [35, 51, 60, 77], true) && $idx < count($sslAttempts) - 1) {
                error_log("[Results] SSL attempt #" . (string)$idx . " failed (cURL #" . (string)$curlErrNo . ": {$curlError}), trying fallback...");
                continue;
            }

            break; // Success or non-SSL error — stop retrying
        }

        if ($httpCode === 404 || $httpCode === 410) {
            error_log("[Results] Fetch returned HTTP " . (string)$httpCode . " for URL: {$url}");
            return ''; // Championship removed or doesn't exist anymore
        }

        if ($html === false || $curlErrNo !== 0 || $httpCode >= 400) {
            if ($curlErrNo === 28 || $curlErrNo === 7) {
                // If the direct fetch was a timeout, skip AllOrigins fallback to avoid wasting time
                $ce = (string)$curlErrNo;
                error_log("[Results] Direct connection timed out (cURL #{$ce}), skipping AllOrigins fallback for: {$url}");
            }
            else {
                error_log("[Results] Direct fetch failed (HTTP " . (string)$httpCode . ", cURL #" . (string)$curlErrNo . "), trying CorsProxy fallback...");

                // Try CorsProxy public proxy as a fallback if direct connection is blocked by WAF
                $fallbackUrl = 'https://corsproxy.io/?' . urlencode($url);
                $chProxy = curl_init($fallbackUrl);
                curl_setopt_array($chProxy, [
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
                    CURLOPT_REDIR_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
                    CURLOPT_TIMEOUT => 15,
                    CURLOPT_CONNECTTIMEOUT => 5,
                    CURLOPT_USERAGENT => $userAgent,
                ]);
                $proxyRes = curl_exec($chProxy);
                $proxyCode = (int)curl_getinfo($chProxy, CURLINFO_HTTP_CODE);
                $proxyErr = curl_errno($chProxy);
                curl_close($chProxy);

                if ($proxyErr === 0 && $proxyCode >= 200 && $proxyCode < 300 && is_string($proxyRes)) {
                    if (strlen($proxyRes) > 500) {
                        error_log("[Results] CorsProxy fallback OK for: {$url}");
                        return $proxyRes;
                    }
                }
            }

            $hc = (string)$httpCode;
            $ce = (string)$curlErrNo;
            $errorDetails = "HTTP {$hc} | cURL #{$ce}: {$curlError}";
            error_log("[Results] Fetch completely failed: {$errorDetails} | URL: {$url}");
            return null;
        }

        // Detect charset and convert to UTF-8 if needed
        if (is_string($html) && preg_match('/charset=([\w-]+)/i', $html, $m)) {
            $charset = strtolower($m[1]);
            if ($charset !== 'utf-8') {
                $converted = mb_convert_encoding($html, 'UTF-8', $charset);
                if ($converted !== false) {
                    $html = $converted;
                }
            }
        }

        return is_string($html) ? $html : null;
    }
}
