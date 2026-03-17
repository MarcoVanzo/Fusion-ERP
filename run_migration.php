<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = FusionERP\Shared\Database::getInstance();
    $db->exec("
        ALTER TABLE `scouting_athletes` 
        ADD COLUMN `is_locked_edit` TINYINT(1) NOT NULL DEFAULT 0 AFTER `source`
    ");
    echo "Migration V064 applied successfully.\n";
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

unlink(__FILE__);
