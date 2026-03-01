<?php
/**
 * Run V011__gyms.sql migration — creates the gyms table
 * Access via: /ERP/run_migration_v011.php?token=FUSION_MIGRATE_V011
 */

$token = $_GET['token'] ?? '';
if ($token !== 'FUSION_MIGRATE_V011') {
    http_response_code(403);
    die('Forbidden');
}

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $dsn = sprintf(
        'mysql:host=%s;dbname=%s;charset=utf8mb4',
        getenv('DB_HOST'),
        getenv('DB_NAME')
    );
    $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASS'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    $sql = file_get_contents(__DIR__ . '/db/migrations/V011__gyms.sql');
    $pdo->exec($sql);

    echo '<pre style="font-family:monospace;padding:20px;">';
    echo "✅ V011__gyms.sql executed successfully.\n";
    echo "   Table 'gyms' created (or already exists).\n";
    echo '</pre>';
}
catch (Throwable $e) {
    http_response_code(500);
    echo '<pre style="color:red;padding:20px;">❌ Migration failed: ' . htmlspecialchars($e->getMessage()) . '</pre>';
}