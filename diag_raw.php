<?php
/**
 * diag_raw.php — Raw DB diagnostic (DELETE AFTER USE)
 * Bypasses Database singleton entirely — connects direttamente con PDO
 */
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=UTF-8');

$out = [];

// ── 1. Read .env manually ─────────────────────────────────────
$envPath = __DIR__ . '/.env';
$out['env_file_exists'] = file_exists($envPath);
$env = [];
if (file_exists($envPath)) {
    foreach (file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if (!$line || $line[0] === '#') continue;
        if (preg_match('/^([^=]+)=(.*)$/', $line, $m)) {
            $env[trim($m[1])] = trim($m[2], " \t\"'");
        }
    }
}

$out['DB_HOST'] = $env['DB_HOST'] ?? '(missing)';
$out['DB_PORT'] = $env['DB_PORT'] ?? '(missing)';
$out['DB_NAME'] = $env['DB_NAME'] ?? '(missing)';
$out['DB_USER'] = $env['DB_USER'] ? 'SET' : '(missing)';
$out['DB_PASS'] = !empty($env['DB_PASS']) ? 'SET (' . strlen($env['DB_PASS']) . ' chars)' : '(missing)';

// ── 2. Raw PDO connection test ────────────────────────────────
$host = $env['DB_HOST'] ?? '127.0.0.1';
$port = $env['DB_PORT'] ?? '3306';
$name = $env['DB_NAME'] ?? '';
$user = $env['DB_USER'] ?? '';
$pass = $env['DB_PASS'] ?? '';

$dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    $out['db_connection'] = 'SUCCESS';

    // Test users table
    $stmt = $pdo->query('SELECT COUNT(*) FROM users WHERE deleted_at IS NULL');
    $out['users_count'] = (int)$stmt->fetchColumn();

    // Test login_attempts (rate limit debug)
    $stmt = $pdo->query(
        'SELECT ip_address, COUNT(*) as cnt FROM login_attempts
         WHERE success = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 300 SECOND)
         GROUP BY ip_address ORDER BY cnt DESC LIMIT 5'
    );
    $out['blocked_ips'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (Throwable $e) {
    $out['db_connection'] = 'FAILED';
    $out['db_error'] = $e->getMessage();
    $out['db_error_code'] = $e->getCode();
}

// ── 3. Check local_debug_error.log ───────────────────────────
$logPath = __DIR__ . '/local_debug_error.log';
if (file_exists($logPath) && is_readable($logPath)) {
    $lines = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $out['error_log_last10'] = array_slice($lines, -10);
} else {
    $out['error_log'] = 'Not found or not readable: ' . $logPath;
}

// ── 4. PHP / Server info ──────────────────────────────────────
$out['php_version'] = PHP_VERSION;
$out['server_software'] = $_SERVER['SERVER_SOFTWARE'] ?? 'unknown';
$out['document_root'] = $_SERVER['DOCUMENT_ROOT'] ?? 'unknown';

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
