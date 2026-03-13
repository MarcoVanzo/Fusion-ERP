<?php
/**
 * VALD Full Reset — svuota vald_test_results e sgancia tutte le atlete.
 * ELIMINARE DOPO L'USO.
 */
header('Content-Type: text/plain; charset=utf-8');
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/vendor/autoload.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

// Carica tenant ID
$db = Database::getInstance();

// Trova il tenant (prende il primo tenant attivo)
$tenantStmt = $db->query("SELECT id FROM tenants WHERE deleted_at IS NULL LIMIT 1");
$tenantId = $tenantStmt->fetchColumn();
if (!$tenantId) {
    die("Nessun tenant trovato!\n");
}
echo "Tenant: $tenantId\n";

// 1. Svuota vald_test_results per questo tenant
$del = $db->prepare("DELETE FROM vald_test_results WHERE tenant_id = :tid");
$del->execute([':tid' => $tenantId]);
$deleted = $del->rowCount();
echo "Eliminati $deleted test VALD\n";

// 2. Sgancia tutte le atlete (vald_athlete_id = NULL)
$unlink = $db->prepare("UPDATE athletes SET vald_athlete_id = NULL WHERE tenant_id = :tid");
$unlink->execute([':tid' => $tenantId]);
$unlinked = $unlink->rowCount();
echo "Sganciati $unlinked atleti\n";

echo "\nReset completato. Ora puoi collegare le atlete e risincronizzare.\n";
