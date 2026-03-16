<?php
require_once __DIR__ . '/Shared/Database.php';
require_once __DIR__ . '/../vendor/autoload.php';

// Dotenv might be in root
$dotenvPath = __DIR__ . '/../';
if (file_exists($dotenvPath . '.env')) {
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable($dotenvPath);
    $dotenv->load();
}

try {
    $db = FusionERP\Shared\Database::getInstance();
    $sql = "ALTER TABLE teams ADD COLUMN gender ENUM('M', 'F') NULL DEFAULT NULL AFTER name;";
    $db->exec($sql);
    echo "OK: Migration applied successfully!\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "OK: Column already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
