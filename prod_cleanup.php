<?php
// Script to be uploaded and run on the production server to clean up duplicates
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();

    // 1. Delete perfect duplicates (same cognito_id) leaving only the most recent one (highest id)
    $stmt = $db->query("
        DELETE e1 FROM ec_orders e1
        JOIN ec_orders e2
        WHERE e1.id < e2.id
          AND e1.cognito_id = e2.cognito_id;
    ");
    $deleted = $stmt->rowCount();
    echo "Deleted $deleted exact duplicates (by cognito_id).\n";

    // 2. Check if the unique constraint exists, if not try to add it
    try {
        $db->exec("ALTER TABLE ec_orders ADD UNIQUE KEY `idx_tenant_cognito` (`tenant_id`, `cognito_id`)");
        echo "Added unique constraint idx_tenant_cognito successfully.\n";
    }
    catch (Exception $e) {
        echo "Unique constraint might already exist or failed: " . $e->getMessage() . "\n";
    }

}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}