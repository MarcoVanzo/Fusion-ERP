<?php
/**
 * sync_results.php — Championship Results & Standings Sync Cron
 * Fusion ERP v1.0
 *
 * Schedulare: 0 3 * * * php /path/to/ERP/api/cron/sync_results.php >> /path/to/ERP/api/cron/results_sync.log 2>&1
 */

declare(strict_types=1);

if (php_sapi_name() !== 'cli' && !defined('FUSION_CRON')) {
    die('This script can only be run from CLI or internal cron trigger.');
}

require_once __DIR__ . '/../../vendor/autoload.php';

// Carica l'ambiente (.env)
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__, 2));
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Results\ResultsRepository;
use FusionERP\Modules\Results\ResultsService;

echo "[Results Cron] Avvio script alle " . date('Y-m-d H:i:s') . "\n";

try {
    $db = Database::getInstance();
    
    // Recupera tutti i tenant attivi
    $tenants = $db->query('SELECT id, name FROM tenants WHERE is_active = 1')->fetchAll(PDO::FETCH_ASSOC);

    if (empty($tenants)) {
        echo "[Results Cron] Nessun tenant attivo trovato.\n";
        exit(0);
    }

    foreach ($tenants as $tenant) {
        echo "[Results Cron] Inizio sincronizzazione per tenant: {$tenant['name']} ({$tenant['id']})...\n";
        
        // Imposta il contesto del tenant per caricare il DB corretto
        TenantContext::setOverride($tenant['id']);

        try {
            // Re-instanziamo repository e service per il nuovo contesto tenant
            $repository = new ResultsRepository();
            $service = new ResultsService($repository);
            
            $camps = $repository->getActiveChampionshipsWithTeamFlags();
            
            if (empty($camps)) {
                echo "  [-] Nessun campionato attivo per questo tenant.\n";
                continue;
            }

            foreach ($camps as $c) {
                echo "  [*] Sincronizzazione: {$c['label']} (ID: {$c['id']})... ";
                
                // Aumenta il time limit per ogni campionato per evitare timeout in caso di federazioni lente
                set_time_limit(60);
                
                $res = $service->syncChampionshipData($c['id']);
                
                if ($res['success']) {
                    echo "✔ OK (Partite: {$res['matches']}, Classifica: {$res['standings']})\n";
                } else {
                    echo "✘ ERRORE: " . ($res['error'] ?? 'Errore sconosciuto') . "\n";
                }
            }

        } catch (\Throwable $e) {
            echo "[Results Cron] ✘ ERRORE INTERNO per tenant {$tenant['id']}: " . $e->getMessage() . "\n";
        }
    }

} catch (\Throwable $e) {
    echo "[Results Cron] ✘ ERRORE FATALE: " . $e->getMessage() . "\n";
    exit(1);
}

echo "[Results Cron] Procedura completata alle " . date('Y-m-d H:i:s') . "\n";
