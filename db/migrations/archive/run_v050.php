<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/Shared/Database.php';

try {
    $db = FusionERP\Shared\Database::getInstance();
    $sql = "ALTER TABLE `network_collaborations` ADD COLUMN `logo_path` VARCHAR(500) NULL AFTER `notes`";
    $db->exec($sql);
    echo "SUCCESS: Migration V050 applied.";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        echo "SUCCESS: Column already exists.";
    } else {
        echo "ERROR: " . $e->getMessage();
    }
}
