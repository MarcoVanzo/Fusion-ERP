<?php
/**
 * One-time post-deploy fix: drops old UNIQUE index on cognito_id,
 * adds composite unique index, and appends GAS_PROXY_URL to .env.
 * DELETE THIS FILE AFTER RUNNING.
 */
declare(strict_types=1);

require_once dirname(__DIR__) . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

// Verify secret
$secret = $_SERVER['HTTP_X_CRON_SECRET'] ?? '';
$appSecret = getenv('APP_SECRET') ?: '';
if (empty($secret) || $secret !== $appSecret) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

$results = [];

// 1. Fix the DROP INDEX issue
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

    // Check if old cognito_id UNIQUE still exists
    $stmt = $pdo->query("SHOW INDEX FROM ec_orders WHERE Key_name = 'cognito_id'");
    $oldIndex = $stmt->fetchAll();

    if (!empty($oldIndex)) {
        try {
            $pdo->exec('ALTER TABLE ec_orders DROP INDEX cognito_id');
            $results[] = 'Dropped old UNIQUE index on cognito_id';
        }
        catch (PDOException $e) {
            $results[] = 'Drop old index error: ' . $e->getMessage();
        }
    }
    else {
        $results[] = 'Old cognito_id UNIQUE index already gone';
    }

    // Check if composite uq_tenant_cognito exists
    $stmt2 = $pdo->query("SHOW INDEX FROM ec_orders WHERE Key_name = 'uq_tenant_cognito'");
    $newIndex = $stmt2->fetchAll();
    if (empty($newIndex)) {
        try {
            $pdo->exec('ALTER TABLE ec_orders ADD UNIQUE KEY uq_tenant_cognito (tenant_id, cognito_id)');
            $results[] = 'Added composite UNIQUE (tenant_id, cognito_id)';
        }
        catch (PDOException $e) {
            $results[] = 'Add composite index error: ' . $e->getMessage();
        }
    }
    else {
        $results[] = 'Composite UNIQUE uq_tenant_cognito already exists';
    }

    // Show current indexes
    $stmt3 = $pdo->query("SHOW INDEX FROM ec_orders");
    $indexes = $stmt3->fetchAll(PDO::FETCH_ASSOC);
    $indexSummary = array_map(fn($i) => $i['Key_name'] . '(' . $i['Column_name'] . ')', $indexes);
    $results[] = 'Current indexes: ' . implode(', ', $indexSummary);

    // Show tenant_id distribution
    $stmt4 = $pdo->query("SELECT tenant_id, COUNT(*) as cnt FROM ec_orders GROUP BY tenant_id");
    $dist = $stmt4->fetchAll(PDO::FETCH_ASSOC);
    $results[] = 'Tenant distribution: ' . json_encode($dist);

}
catch (Exception $e) {
    $results[] = 'DB error: ' . $e->getMessage();
}

// 2. Add GAS_PROXY_URL to .env if missing
$envPath = dirname(__DIR__) . '/.env';
if (file_exists($envPath)) {
    $envContent = file_get_contents($envPath);
    if (strpos($envContent, 'GAS_PROXY_URL') === false) {
        $gasLine = "\n# ── GAS PROXY (FIPAV scraping) ───────────────────────────────────────────────\nGAS_PROXY_URL=https://script.google.com/macros/s/AKfycbzWEVIrWNDnKqP7U5lrL5pM2EMK_UuPMJoJHi5RIpnhJrx-r04MmWYixQoxV6TaAIU/exec\n";
        file_put_contents($envPath, $envContent . $gasLine);
        $results[] = 'GAS_PROXY_URL added to .env';
    }
    else {
        $results[] = 'GAS_PROXY_URL already in .env';
    }
}
else {
    $results[] = '.env not found at ' . $envPath;
}

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT);