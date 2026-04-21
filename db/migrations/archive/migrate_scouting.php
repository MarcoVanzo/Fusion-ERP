<?php
require __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__), '.env.prod');
$dotenv->safeLoad();

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$db   = $_ENV['DB_NAME'] ?? 'fusion_erp';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    $pdo->exec("
        ALTER TABLE scouting_athletes
        ADD COLUMN tenant_id VARCHAR(30) NOT NULL DEFAULT 'TNT_default' AFTER id,
        ADD KEY idx_scounting_tenant (tenant_id)
    ");
    echo "Migration applied successfully.\n";
} catch (PDOException $e) {
    echo "Migration error (might already exist): " . $e->getMessage() . "\n";
}
