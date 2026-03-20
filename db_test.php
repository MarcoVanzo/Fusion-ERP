<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$host   = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: '127.0.0.1';
$port   = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
$dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'fusion_erp';

echo "Using HOST: $host, PORT: $port, DBNAME: $dbname\n";
