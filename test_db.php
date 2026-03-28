<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
echo "Starting...\n";
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();
try {
    $db = new \PDO("mysql:host=" . $_ENV['DB_HOST'] . ";dbname=" . $_ENV['DB_NAME'] . ";charset=utf8mb4", $_ENV['DB_USER'], $_ENV['DB_PASS']);
    $db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
    $stmt = $db->query("SELECT * FROM transports");
    $res = $stmt->fetchAll(\PDO::FETCH_ASSOC);
    echo "Found " . count($res) . " transports.\n";
} catch (\Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
echo "Done.\n";
