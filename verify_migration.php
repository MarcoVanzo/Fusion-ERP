<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';

$dotenvPath = __DIR__ . '/';
if (file_exists($dotenvPath . '.env')) {
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable($dotenvPath);
    $dotenv->load();
}

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query('SHOW COLUMNS FROM teams');
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo implode(", ", $cols);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
