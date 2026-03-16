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

    $sql = "ALTER TABLE `foresteria_media` MODIFY COLUMN `type` ENUM('photo', 'video', 'youtube') NOT NULL DEFAULT 'photo';";
    
    $pdo->exec($sql);
    echo "SUCCESS_MIGRATION_V060";
} catch(PDOException $e) {
    echo "ERROR: " . $e->getMessage();
}
