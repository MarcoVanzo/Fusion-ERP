<?php
/**
 * diag_login.php — Login diagnostic (DELETE AFTER USE)
 */
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json; charset=UTF-8');

$out = [];

// ── 1. Read local_debug_error.log ──────────────────────────────
$logPath = __DIR__ . '/local_debug_error.log';
if (file_exists($logPath)) {
    $lines = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $out['error_log'] = array_slice($lines, -20); // last 20 lines
} else {
    $out['error_log'] = 'File non trovato: ' . $logPath;
}

// ── 2. PHP & Session info ──────────────────────────────────────
$out['php_version'] = PHP_VERSION;
$out['session_save_path'] = session_save_path();
$out['session_writable'] = is_writable(session_save_path() ?: sys_get_temp_dir());

// ── 3. Test vendor autoload ────────────────────────────────────
$autoload = __DIR__ . '/vendor/autoload.php';
$out['autoload_exists'] = file_exists($autoload);
if ($out['autoload_exists']) {
    try {
        require_once $autoload;
        $out['autoload_ok'] = true;
    } catch (Throwable $e) {
        $out['autoload_ok'] = false;
        $out['autoload_error'] = $e->getMessage();
    }
}

// ── 4. Test .env / Dotenv ──────────────────────────────────────
try {
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
    $dotenv->safeLoad();
    $out['dotenv_ok'] = true;
    $out['APP_ENV']   = getenv('APP_ENV') ?: '(not set)';
    $out['DB_HOST']   = getenv('DB_HOST') ?: '(not set)';
    $out['DB_NAME']   = getenv('DB_NAME') ?: '(not set)';
    $out['DB_USER']   = getenv('DB_USER') ? 'SET' : '(not set)';
    $out['DB_PASS']   = getenv('DB_PASS') ? 'SET' : '(not set)';
} catch (Throwable $e) {
    $out['dotenv_ok'] = false;
    $out['dotenv_error'] = $e->getMessage();
}

// ── 5. Test DB connection ──────────────────────────────────────
try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query('SELECT 1');
    $out['db_ok'] = $stmt !== false;
} catch (Throwable $e) {
    $out['db_ok'] = false;
    $out['db_error'] = $e->getMessage();
}

// ── 6. Test users table ────────────────────────────────────────
if ($out['db_ok'] ?? false) {
    try {
        $stmt = $db->query('SELECT id, email, role, is_active, deleted_at FROM users LIMIT 3');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $out['users_sample'] = $rows;
    } catch (Throwable $e) {
        $out['users_error'] = $e->getMessage();
    }

    // ── 7. Test login_attempts table ──────────────────────────
    try {
        $stmt = $db->query(
            'SELECT ip_address, COUNT(*) as cnt, MAX(created_at) as last_seen
             FROM login_attempts
             WHERE success = 0 AND created_at >= DATE_SUB(NOW(), INTERVAL 900 SECOND)
             GROUP BY ip_address
             ORDER BY cnt DESC LIMIT 5'
        );
        $out['rate_limit_active'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (Throwable $e) {
        $out['rate_limit_error'] = $e->getMessage();
    }
}

// ── 8. Test Auth class ─────────────────────────────────────────
try {
    FusionERP\Shared\Auth::startSession();
    $out['auth_session_ok'] = true;
    $out['session_id'] = session_id() ? 'active' : 'none';
} catch (Throwable $e) {
    $out['auth_session_ok'] = false;
    $out['auth_session_error'] = $e->getMessage();
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
