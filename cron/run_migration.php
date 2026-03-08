<?php
/**
 * Cron Migration Runner — Executes pending migrations
 * Fusion ERP v1.0
 *
 * Call: curl -s "https://...fusionerp.it/ERP/cron/run_migration.php" -H "X-Cron-Secret: <APP_SECRET>"
 *       -d '{"file":"V023__tenant_settings.sql"}'
 */

declare(strict_types=1);

// Load env
require_once dirname(__DIR__) . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

// Verify secret
$secret = $_SERVER['HTTP_X_CRON_SECRET'] ?? ($_GET['secret'] ?? '');
$appSecret = getenv('APP_SECRET') ?: '';
if (empty($secret) || $secret !== $appSecret) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// Parse request
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$file = basename($input['file'] ?? ($_GET['file'] ?? ''));

$whitelist = [
    'V023__tenant_settings.sql',
    'V024__tenant_invitations_and_chat.sql',
    'V025__finance_core.sql',
    'V026__invoices.sql',
    'V027__federation.sql',
    'V044__import_staff.sql',
    'V045__federation_logos.sql',
];

if (!in_array($file, $whitelist, true)) {
    echo json_encode(['success' => false, 'error' => "File not allowed: " . htmlspecialchars($file, ENT_QUOTES, 'UTF-8')]);
    exit;
}

$path = dirname(__DIR__) . '/db/migrations/' . $file;
if (!file_exists($path)) {
    echo json_encode(['success' => false, 'error' => "File not found: " . htmlspecialchars($file, ENT_QUOTES, 'UTF-8')]);
    exit;
}

// Connect
try {
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $db = getenv('DB_NAME') ?: 'fusion_erp';
    $user = getenv('DB_USER') ?: '';
    $pass = getenv('DB_PASS') ?: '';

    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4",
        $user, $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
}
catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'DB connection failed: ' . $e->getMessage()]);
    exit;
}

// Read and execute
$sql = file_get_contents($path);
$sql = preg_replace('/--.*$/m', '', $sql);

$pdo->exec('SET FOREIGN_KEY_CHECKS = 0');

$parts = explode(';', $sql);
$executed = 0;
$skipped = 0;
$errors = [];

foreach ($parts as $stmt) {
    $stmt = trim($stmt);
    if (empty($stmt))
        continue;

    try {
        $pdo->exec($stmt);
        $executed++;
    }
    catch (PDOException $e) {
        $msg = $e->getMessage();
        if (str_contains($msg, 'already exists') || str_contains($msg, 'Duplicate')) {
            $skipped++;
        }
        else {
            $errors[] = $msg;
        }
    }
}

$pdo->exec('SET FOREIGN_KEY_CHECKS = 1');

echo json_encode([
    'success' => true,
    'file' => htmlspecialchars($file, ENT_QUOTES, 'UTF-8'),
    'executed' => $executed,
    'skipped' => $skipped,
    'errors' => $errors,
], JSON_PRETTY_PRINT);