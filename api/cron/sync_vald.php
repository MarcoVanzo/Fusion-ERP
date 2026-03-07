<?php
/**
 * sync_vald.php — VALD Performance Integration Sync Cron
 * Fusion ERP v1.0
 */

declare(strict_types=1);

if (php_sapi_name() !== 'cli' && !defined('FUSION_CRON')) {
    die('This script can only be run from CLI or internal cron trigger.');
}

require_once __DIR__ . '/../../vendor/autoload.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdService;
use FusionERP\Modules\Vald\ValdRepository;

$db = Database::getInstance();
$valdService = new ValdService();
$valdRepo = new ValdRepository();

// Get all active tenants
$tenants = $db->query('SELECT id, name FROM tenants WHERE is_active = 1')->fetchAll();

foreach ($tenants as $tenant) {
    TenantContext::setOverride($tenant['id']);
    echo "Sincronizzazione VALD per Tenant: {$tenant['name']} ({$tenant['id']})...\n";

    try {
        // 1. Fetch results from VALD
        // In a real scenario, we might use the last sync date to fetch only new tests
        $lastSync = $valdRepo->getLatestTestDate();
        $results = $valdService->getTestResults($lastSync ?: '');

        if (!$results || !isset($results['data'])) {
            echo "Nessun nuovo risultato trovato.\n";
            continue;
        }

        $count = 0;
        foreach ($results['data'] as $test) {
            // VALD 'ExternalId' should match our athlete ID
            $athleteId = $test['athleteExternalId'] ?? '';

            if (!$athleteId) {
                // Try to find athlete by VALD ID if we had a mapping (not implemented yet)
                continue;
            }

            // Verify athlete exists in this tenant
            $stmt = $db->prepare('SELECT id FROM athletes WHERE id = :id AND tenant_id = :tid LIMIT 1');
            $stmt->execute([':id' => $athleteId, ':tid' => $tenant['id']]);
            if (!$stmt->fetch()) {
                continue;
            }

            // Save result
            $valdRepo->saveResult([
                ':id' => 'VTR_' . bin2hex(random_bytes(4)),
                ':tenant_id' => $tenant['id'],
                ':athlete_id' => $athleteId,
                ':test_id' => $test['id'],
                ':test_date' => $test['testDate'],
                ':test_type' => $test['testType'],
                ':metrics' => json_encode($test['metrics'] ?? [])
            ]);
            $count++;
        }

        echo "Sincronizzati " . (string)$count . " nuovi test.\n";
    }
    catch (\Throwable $e) {
        echo "ERRORE per tenant {$tenant['id']}: " . $e->getMessage() . "\n";
    }
}

echo "Sincronizzazione completata.\n";