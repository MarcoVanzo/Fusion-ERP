<?php
/**
 * V066 Migration: Add athlete document columns
 * Run via browser: /ERP/api/migrate_v066.php
 * DELETE THIS FILE AFTER RUNNING!
 */
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
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $columns = [
        'contract_file_path',
        'id_doc_front_file_path',
        'id_doc_back_file_path',
        'cf_doc_front_file_path',
        'cf_doc_back_file_path',
        'medical_cert_file_path'
    ];

    $added = [];
    $skipped = [];

    foreach ($columns as $col) {
        $check = $pdo->query("SHOW COLUMNS FROM athletes LIKE '$col'");
        if ($check->rowCount() > 0) {
            $skipped[] = $col;
            continue;
        }
        $pdo->exec("ALTER TABLE athletes ADD COLUMN $col VARCHAR(500) DEFAULT NULL");
        $added[] = $col;
    }

    echo "SUCCESS_MIGRATION_V066\n";
    if ($added) echo "Added: " . implode(', ', $added) . "\n";
    if ($skipped) echo "Already existed: " . implode(', ', $skipped) . "\n";

} catch(PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "SUCCESS_MIGRATION_V066_ALREADY_EXISTS\n";
    } else {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
}
