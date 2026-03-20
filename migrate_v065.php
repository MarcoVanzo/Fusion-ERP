<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/');
$dotenv->safeLoad();

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$db   = $_ENV['DB_NAME'] ?? 'fusion_dev';
$user = $_ENV['DB_USER'] ?? 'fusion';
$pass = $_ENV['DB_PASS'] ?? 'fusion123';
$port = $_ENV['DB_PORT'] ?? '3306';

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

    $sql = "
    ALTER TABLE `societa_sponsors` 
    ADD COLUMN `stagione` VARCHAR(50) NULL AFTER `name`,
    ADD COLUMN `importo` DECIMAL(10,2) NULL AFTER `tiktok_url`,
    ADD COLUMN `rapporto` DECIMAL(10,2) NULL AFTER `importo`,
    ADD COLUMN `sponsorizzazione` DECIMAL(10,2) NULL AFTER `rapporto`;
    ";
    
    $pdo->exec($sql);
    echo "SUCCESS_MIGRATION_V065\n";
} catch(PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "SUCCESS_MIGRATION_V065_ALREADY_EXISTS\n";
    } else {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
}
