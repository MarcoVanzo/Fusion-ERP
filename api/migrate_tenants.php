<?php
/**
 * Tenant Migration Script — Align TNT_default to TNT_fusion
 */
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

use FusionERP\Shared\Database;

$db = Database::getInstance();

$tables = [
    'athletes', 
    'teams', 
    'users', 
    'societa_profile', 
    'societa_roles', 
    'societa_directors', 
    'societa_history', 
    'societa_values', 
    'medical_visits',
    'team_seasons'
];

echo "--- MIGRATION START ---\n";

foreach ($tables as $table) {
    try {
        // Check if tenant_id column exists
        $check = $db->query("SHOW COLUMNS FROM `$table` LIKE 'tenant_id'")->fetch();
        if (!$check) {
            echo "Skipping $table: No tenant_id column found.\n";
            continue;
        }

        $stmt = $db->prepare("UPDATE `$table` SET tenant_id = 'TNT_fusion' WHERE tenant_id = 'TNT_default' OR tenant_id IS NULL OR tenant_id = ''");
        $stmt->execute();
        $count = $stmt->rowCount();
        echo "Updated table `$table`: $count rows moved to TNT_fusion.\n";
    } catch (Exception $e) {
        echo "Error updating table `$table`: " . $e->getMessage() . "\n";
    }
}

echo "--- MIGRATION END ---\n";
