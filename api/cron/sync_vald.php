<?php
/**
 * sync_vald.php — VALD Performance Integration Sync Cron
 * Fusion ERP v1.0
 *
 * Schedulare: 0 2 * * * php /path/to/public_html/ERP/api/cron/sync_vald.php >> /tmp/vald_sync.log 2>&1
 */

declare(strict_types=1);

if (php_sapi_name() !== 'cli' && !defined('FUSION_CRON')) {
    die('This script can only be run from CLI or internal cron trigger.');
}

require_once __DIR__ . '/../../vendor/autoload.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdController;

$db = Database::getInstance();

// Fetch all active tenants
$tenants = $db->query('SELECT id, name FROM tenants WHERE is_active = 1')->fetchAll();

if (empty($tenants)) {
    echo "[VALD Cron] Nessun tenant attivo trovato.\n";
    exit(0);
}

foreach ($tenants as $tenant) {
    TenantContext::setOverride($tenant['id']);
    echo "[VALD Cron] Sincronizzazione per tenant: {$tenant['name']} ({$tenant['id']})...\n";

    try {
        // Reuse the shared performSync() logic from ValdController
        $controller = new ValdController();
        $stats = $controller->performSync();

        echo "[VALD Cron] ✔ Trovati: {$stats['found']}, Salvati: {$stats['synced']}, Saltati: {$stats['skipped']}\n";

    } catch (\Throwable $e) {
        echo "[VALD Cron] ✘ ERRORE per tenant {$tenant['id']}: " . $e->getMessage() . "\n";
    }
}

echo "[VALD Cron] Completato alle " . date('Y-m-d H:i:s') . "\n";