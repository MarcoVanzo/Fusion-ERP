<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$host   = $_ENV['DB_HOST'] ?? '127.0.0.1';
$port   = $_ENV['DB_PORT'] ?? '3306';
$dbname = $_ENV['DB_NAME'] ?? '';
$user   = $_ENV['DB_USER'] ?? '';
$pass   = $_ENV['DB_PASS'] ?? '';

echo "Host: $host, DB: $dbname, User: $user<br>\n";

$dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";
$opts = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $opts);
    $pdo->exec("ALTER TABLE societa_sponsors ADD COLUMN tipo VARCHAR(50) DEFAULT 'Sponsor' AFTER name;");
    echo "SUCCESS: Colonna 'tipo' aggiunta correttamente.";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "SUCCESS: La colonna 'tipo' esiste già.";
    } else {
        echo "ERROR: " . $e->getMessage();
    }
}
