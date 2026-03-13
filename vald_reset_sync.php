<?php
/**
 * VALD Reset & Resync — ELIMINARE DOPO L'USO.
 * Svuota vald_test_results e riavvia la sincronizzazione completa.
 */
set_time_limit(300);
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdController;
use FusionERP\Modules\Vald\ValdCredentials;

// --- 1. Connect DB ---
$db = Database::getInstance();

// --- 2. Count and delete old records ---
$before = $db->query('SELECT COUNT(*) FROM vald_test_results')->fetchColumn();
echo "Records VALD prima della pulizia: $before\n";

$db->exec('DELETE FROM vald_test_results');
$after = $db->query('SELECT COUNT(*) FROM vald_test_results')->fetchColumn();
echo "Records VALD dopo DELETE: $after\n\n";

// --- 3. Set tenant context (take first active tenant) ---
$stmt = $db->query('SELECT id FROM tenants WHERE status = "active" LIMIT 1');
$tenantRow = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$tenantRow) {
    $stmt2 = $db->query('SELECT id FROM tenants LIMIT 1');
    $tenantRow = $stmt2->fetch(PDO::FETCH_ASSOC);
}
if (!$tenantRow) {
    echo "ERRORE: nessun tenant trovato.\n";
    exit;
}
TenantContext::set($tenantRow['id']);
echo "Tenant: {$tenantRow['id']}\n";

// --- 4. Run full sync ---
echo "\nAvvio sincronizzazione VALD...\n";
echo "(può richiedere 1-3 minuti)\n\n";
flush();
ob_flush();

$controller = new ValdController();
$result = $controller->performSync();

echo "=== RISULTATO SYNC ===\n";
echo "Test trovati   : {$result['found']}\n";
echo "Salvati        : {$result['synced']}\n";
echo "Saltati        : {$result['skipped']}\n";
if (!empty($result['unlinkedAthletes'])) {
    echo "Atleti non collegati: " . count($result['unlinkedAthletes']) . "\n";
    foreach ($result['unlinkedAthletes'] as $id) {
        echo "  - $id\n";
    }
}

// --- 5. Spot-check: confirm RSImod values look sane ---
echo "\n=== VERIFICA VALORI RSImod ===\n";
$rows = $db->query('SELECT metrics FROM vald_test_results LIMIT 10')->fetchAll(PDO::FETCH_COLUMN);
$ok = 0; $bad = 0;
foreach ($rows as $json) {
    $m = json_decode($json, true) ?: [];
    $rsi = $m['RSIModified']['Value'] ?? null;
    if ($rsi === null) continue;
    if ($rsi >= 0.1 && $rsi <= 3.0) $ok++;
    else { $bad++; echo "  RSImod anomalo: $rsi\n"; }
}
echo "RSImod nel range [0.1–3.0]: $ok record | Anomali: $bad record\n";
