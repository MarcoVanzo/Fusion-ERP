<?php
require "vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

try {
    $host = $_ENV['DB_HOST'] ?? '127.0.0.1';
    $port = $_ENV['DB_PORT'] ?? '3306';
    $dbname = $_ENV['DB_NAME'] ?? 'fusion_erp';
    $user = $_ENV['DB_USER'] ?? '';
    $pass = $_ENV['DB_PASS'] ?? '';
    
    $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
    $db = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $stmt = $db->query("SHOW TABLES LIKE 'societa_titoli'");
    $tables = $stmt->fetchAll();
    
    if (empty($tables)) {
        echo "TABLE DOES NOT EXIST!\n";
    } else {
        echo "TABLE EXISTS.\nSchema:\n";
        $stmt = $db->query("DESCRIBE societa_titoli");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
} catch (\Exception $e) {
    echo "DB ERROR: " . $e->getMessage() . " on host " . ($host ?? 'unknown');
}
