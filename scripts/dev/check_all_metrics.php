<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Auth.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

header('Content-Type: text/plain');

try {
    $db = Database::getInstance();
    $tenantId = "TNT_fusion"; // Force tenant for testing or use resolve()
    
    echo "Checking VALD data for tenant: $tenantId\n";
    echo "====================================\n";

    // 1. Check total results in vald_test_results
    $stmt = $db->prepare("SELECT COUNT(*) FROM vald_test_results");
    $stmt->execute();
    $totalAll = $stmt->fetchColumn();
    echo "Total VALD results (all tenants): $totalAll\n";

    // 2. Check results for specific tenant
    $stmt = $db->prepare("SELECT COUNT(*) FROM vald_test_results WHERE tenant_id = :tid");
    $stmt->execute([':tid' => $tenantId]);
    $totalTenant = $stmt->fetchColumn();
    echo "Total VALD results (this tenant): $totalTenant\n";

    // 3. Check linked athletes
    $stmt = $db->prepare("SELECT COUNT(*) FROM athletes WHERE tenant_id = :tid AND vald_athlete_id IS NOT NULL");
    $stmt->execute([':tid' => $tenantId]);
    $linkedCount = $stmt->fetchColumn();
    echo "Athletes linked to VALD: $linkedCount\n";

    // 4. Sample some results
    if ($totalTenant > 0) {
        echo "\nSample results for this tenant:\n";
        $stmt = $db->prepare("SELECT athlete_id, test_date, test_type, metrics FROM vald_test_results WHERE tenant_id = :tid ORDER BY test_date DESC LIMIT 5");
        $stmt->execute([':tid' => $tenantId]);
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "- Date: {$row['test_date']}, Type: {$row['test_type']}, ERP ID: {$row['athlete_id']}\n";
            $m = json_decode($row['metrics'], true);
            echo "  Metrics: " . (isset($m['RSIModified']) ? "RSI=" . $m['RSIModified']['Value'] : "N/A") . "\n";
        }
    } else {
        echo "\nWARNING: No results found for tenant $tenantId. Checking if there are results with NULL or empty tenant_id...\n";
        $stmt = $db->prepare("SELECT COUNT(*) FROM vald_test_results WHERE tenant_id IS NULL OR tenant_id = ''");
        $stmt->execute();
        $nullTenant = $stmt->fetchColumn();
        echo "Results with NULL/empty tenant_id: $nullTenant\n";
        
        if ($nullTenant > 0) {
            echo "Sample of untagged results:\n";
            $stmt = $db->prepare("SELECT athlete_id, test_date FROM vald_test_results WHERE tenant_id IS NULL OR tenant_id = '' LIMIT 3");
            $stmt->execute();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                echo "- Date: {$row['test_date']}, Athlete ERP ID: {$row['athlete_id']}\n";
            }
        }
    }

    // 5. Check Athlete list subquery results
    echo "\nChecking Athletes list subquery results:\n";
    $stmt = $db->prepare("
        SELECT id, full_name,
               (SELECT test_date FROM vald_test_results WHERE athlete_id = a.id ORDER BY test_date DESC LIMIT 1) AS last_date
        FROM athletes a
        WHERE tenant_id = :tid AND deleted_at IS NULL
        ORDER BY last_date DESC
        LIMIT 10
    ");
    $stmt->execute([':tid' => $tenantId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $r) {
        echo "- {$r['full_name']} (ID: {$r['id']}): Last Metric Date = " . ($r['last_date'] ?: "NULL") . "\n";
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
