<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

$db = Database::getInstance();

echo "--- DIAGNOSTIC START ---\n";
// 1. Check current tenant
$tid = TenantContext::id();
echo "Current Tenant ID detected: $tid\n";

// 2. Check athletes in DB
try {
    $stmt = $db->query("SELECT tenant_id, is_active, COUNT(*) as cnt FROM athletes GROUP BY tenant_id, is_active");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Athlete Distribution:\n";
    foreach ($rows as $row) {
        printf("  Tenant: %s | Active: %s | Count: %d\n", 
            $row['tenant_id'] ?? 'NULL', 
            $row['is_active'] ?? 'NULL', 
            $row['cnt']);
    }
} catch (Exception $e) {
    echo "Error querying athletes: " . $e->getMessage() . "\n";
}

// 3. Check if we need a default tenant override
if ($tid === 'TNT_default' && !empty($rows)) {
    echo "WARNING: Default tenant detected but athletes found in other tenants.\n";
}

echo "--- DIAGNOSTIC END ---\n";
