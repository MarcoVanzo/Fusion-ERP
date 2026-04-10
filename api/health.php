<?php
/**
 * Health Check — Lightweight endpoint for uptime monitoring
 *
 * URL:  /api/health.php
 * AUTH: None (public — designed for external monitoring tools)
 *
 * Returns:
 * {
 *   "status": "ok",
 *   "timestamp": "2025-01-01T12:00:00+00:00",
 *   "checks": {
 *     "php": { "ok": true, "version": "8.2.x" },
 *     "database": { "ok": true, "latency_ms": 12 },
 *     "disk": { "ok": true, "free_mb": 1234 },
 *     "env": { "ok": true }
 *   }
 * }
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

// Prevent access to full stack trace in production
set_exception_handler(function (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'error'  => 'Health check failed: ' . $e->getMessage()
    ]);
    exit;
});

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

$checks = [];
$overallOk = true;

// ─── PHP ─────────────────────────────────────────────────────────────────────
$checks['php'] = [
    'ok'      => true,
    'version' => PHP_VERSION,
];

// ─── Database ────────────────────────────────────────────────────────────────
try {
    $start = microtime(true);
    $pdo = \FusionERP\Shared\Database::getInstance();
    $pdo->query('SELECT 1');
    $latency = round((microtime(true) - $start) * 1000, 1);

    $checks['database'] = [
        'ok'         => true,
        'latency_ms' => $latency,
    ];
} catch (\Throwable $e) {
    $checks['database'] = [
        'ok'    => false,
        'error' => 'Connection failed',
    ];
    $overallOk = false;
}

// ─── Disk ────────────────────────────────────────────────────────────────────
try {
    $uploadsDir = dirname(__DIR__) . '/uploads';
    if (!function_exists('disk_free_space') || !is_dir($uploadsDir)) {
        throw new \RuntimeException('disk_free_space unavailable');
    }
    $freeBytes = @disk_free_space($uploadsDir);
    if ($freeBytes === false) {
        throw new \RuntimeException('disk_free_space returned false');
    }
    $freeMb = (int) round($freeBytes / 1048576);
    $checks['disk'] = [
        'ok'      => $freeMb > 100,  // Alert if less than 100MB free
        'free_mb' => $freeMb,
    ];
} catch (\Throwable $e) {
    $checks['disk'] = [
        'ok'   => true,  // Don't fail health check if we can't read disk
        'note' => 'disk_free_space unavailable on this host',
    ];
}
if (!$checks['disk']['ok']) $overallOk = false;

// ─── Environment ─────────────────────────────────────────────────────────────
$requiredEnv = ['DB_HOST', 'DB_NAME', 'DB_USER'];
$missingEnv = array_filter($requiredEnv, fn($k) => empty($_ENV[$k] ?? getenv($k)));
$checks['env'] = [
    'ok' => empty($missingEnv),
];
if (!$checks['env']['ok']) $overallOk = false;

// ─── Response ────────────────────────────────────────────────────────────────
http_response_code($overallOk ? 200 : 503);

echo json_encode([
    'status'    => $overallOk ? 'ok' : 'degraded',
    'timestamp' => date('c'),
    'checks'    => $checks,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
