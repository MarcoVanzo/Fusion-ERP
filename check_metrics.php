<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/TenantContext.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

try {
    $db = Database::getInstance();
    
    echo "--- CHECKING VALD DATA ---\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM vald_test_results");
    echo "TOTAL VALD RESULTS: " . $stmt->fetchColumn() . "\n";
    
    $stmt = $db->query("SELECT tenant_id, COUNT(*) as cnt FROM vald_test_results GROUP BY tenant_id");
    echo "RESULTS BY TENANT:\n";
    while ($row = $stmt->fetch()) {
        echo "- Tenant {$row['tenant_id']}: {$row['cnt']} results\n";
    }
    
    $stmt = $db->query("SELECT COUNT(*) FROM athletes WHERE vald_athlete_id IS NOT NULL");
    echo "ATHLETES WITH VALD ID: " . $stmt->fetchColumn() . "\n";
    
    $stmt = $db->query("SELECT COUNT(*) FROM athletes WHERE latest_vald_metrics IS NOT NULL");
    echo "ATHLETES WITH CACHED METRICS: " . $stmt->fetchColumn() . "\n";
    
    echo "--- SAMPLE DATA ---\n";
    $stmt = $db->query("SELECT id, full_name, vald_athlete_id, latest_vald_date, tenant_id FROM athletes WHERE vald_athlete_id IS NOT NULL LIMIT 5");
    echo "SAMPLE ATHLETES:\n";
    while ($row = $stmt->fetch()) {
        echo "- {$row['full_name']} (ID: {$row['id']}, VALD: {$row['vald_athlete_id']}, Date: {$row['latest_vald_date']}, Tenant: {$row['tenant_id']})\n";
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
