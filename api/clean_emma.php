<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once __DIR__ . '/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Soft delete the duplicate
    $db->exec("UPDATE athletes SET deleted_at = NOW(), is_active = 0 WHERE id = 'ATH_e73778e1'");
    echo "Deleted duplicate ATH_e73778e1.\n";
    
    // Ensure the main one is active and clean
    $db->exec("UPDATE athletes SET deleted_at = NULL, is_active = 1 WHERE id = 'ATH_c16fcee1'");
    echo "Ensured ATH_c16fcee1 is active.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
