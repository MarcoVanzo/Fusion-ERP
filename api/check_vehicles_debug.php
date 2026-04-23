<?php
/**
 * Diagnostic script to verify vehicle data distribution across tenants.
 */
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once __DIR__ . '/Shared/Database.php';
require_once __DIR__ . '/Shared/TenantContext.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

header('Content-Type: text/plain');

try {
    $db = Database::getInstance();
    
    echo "=== FUSION ERP VEHICLE DIAGNOSTIC ===\n\n";
    
    // 1. Current Context
    session_start();
    echo "Current Session Tenant ID: " . ($_SESSION['user']['tenant_id'] ?? 'NOT SET') . "\n";
    echo "Resolved TenantContext::id(): " . TenantContext::id() . "\n";
    echo "Environment DEFAULT_TENANT_ID: " . (getenv('DEFAULT_TENANT_ID') ?: 'NOT SET (Defaults to TNT_fusion)') . "\n\n";

    // 2. Data Distribution
    $tables = ['vehicles', 'vehicle_maintenance', 'vehicle_anomalies', 'drivers'];
    echo "--- DATA DISTRIBUTION ---\n";
    foreach ($tables as $table) {
        echo "Table: $table\n";
        $stmt = $db->query("SELECT tenant_id, COUNT(*) as count FROM $table GROUP BY tenant_id");
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        if (empty($results)) {
            echo "  (No records found)\n";
        } else {
            foreach ($results as $res) {
                $tid = $res['tenant_id'] ?: 'NULL';
                echo "  Tenant: $tid -> Count: {$res['count']}\n";
            }
        }
        echo "\n";
    }

    // 3. Sample Data
    echo "--- SAMPLE VEHICLES ---\n";
    $stmt = $db->query("SELECT id, name, license_plate, tenant_id FROM vehicles LIMIT 5");
    $vehicles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($vehicles as $v) {
        echo "  ID: {$v['id']} | Name: {$v['name']} | Plate: {$v['license_plate']} | Tenant: {$v['tenant_id']}\n";
    }

    echo "\n=== DIAGNOSTIC COMPLETE ===\n";

} catch (Exception $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
}
