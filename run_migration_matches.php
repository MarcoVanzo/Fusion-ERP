<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once 'api/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $sql = "ALTER TABLE federation_matches ADD COLUMN round VARCHAR(50) NULL AFTER status";
    $db->exec($sql);
    echo "Migration ADD COLUMN 'round' executed successfully.\n";
}
catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "Column 'round' already exists.\n";
    }
    else {
        echo "Migration failed: " . $e->getMessage() . "\n";
    }
}