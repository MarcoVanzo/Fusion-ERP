<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
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
    ALTER TABLE `staff_members`
        ADD COLUMN `photo_path` VARCHAR(255) NULL AFTER `notes`,
        ADD COLUMN `contract_status` VARCHAR(50) NULL AFTER `photo_path`,
        ADD COLUMN `contract_esign_document_id` VARCHAR(100) NULL AFTER `contract_status`,
        ADD COLUMN `contract_esign_signing_url` VARCHAR(255) NULL AFTER `contract_esign_document_id`,
        ADD COLUMN `contract_signed_pdf_path` VARCHAR(255) NULL AFTER `contract_esign_signing_url`,
        ADD COLUMN `contract_signed_at` DATETIME NULL AFTER `contract_signed_pdf_path`,
        ADD COLUMN `contract_valid_from` DATE NULL AFTER `contract_signed_at`,
        ADD COLUMN `contract_valid_to` DATE NULL AFTER `contract_valid_from`,
        ADD COLUMN `contract_monthly_fee` DECIMAL(10,2) NULL AFTER `contract_valid_to`;
    ";
    
    $pdo->exec($sql);
    echo "SUCCESS_MIGRATION_V053";
} catch(PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "SUCCESS_MIGRATION_V053_ALREADY_EXISTS";
    } else {
        echo "ERROR: " . $e->getMessage();
    }
}
