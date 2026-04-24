<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once __DIR__ . '/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Update tenant_id
    $db->exec("UPDATE athletes SET tenant_id = 'TNT_fusion' WHERE id = 'ATH_c16fcee1'");
    echo "Updated Emma's tenant_id to TNT_fusion!\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
