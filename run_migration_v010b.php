<?php
/**
 * run_migration_v010b.php — Create meta_oauth_states via proper DB connection
 * Uses vendor/autoload.php + Dotenv just like router.php does
 * DELETE AFTER USE!
 */
if (($_GET['token'] ?? '') !== 'FUSION_MIGRATE_2526') {
    http_response_code(403);
    die('Forbidden');
}
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $host = getenv('DB_HOST');
    $port = getenv('DB_PORT') ?: '3306';
    $dbname = getenv('DB_NAME');
    $user = getenv('DB_USER');
    $pass = getenv('DB_PASS');

    echo "Connecting to {$host}:{$port}/{$dbname} as {$user}...\n";

    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4",
        $user, $pass,
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );

    echo "✅ Connected\n\n";

    $pdo->exec("CREATE TABLE IF NOT EXISTS meta_oauth_states (
        token      VARCHAR(64)  NOT NULL PRIMARY KEY,
        user_id    INT          NOT NULL,
        expires_at DATETIME     NOT NULL,
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    echo "✅ Table meta_oauth_states created (or already exists)\n";

    $r = $pdo->query("SHOW TABLES LIKE 'meta_oauth_states'")->fetch();
    echo "✅ Verified: " . ($r ? 'EXISTS' : 'NOT FOUND') . "\n";

    echo "\n⚠️  DELETE THIS FILE!\n";
}
catch (Throwable $e) {
    echo "❌ " . $e->getMessage() . "\n";
}