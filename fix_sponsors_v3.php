<?php
/**
 * fix_sponsors_v3.php — Final Reconciliator
 * Moves all sponsors from TNT_default to TNT_fusion.
 * Updates logo paths for consistency.
 */

declare(strict_types=1);

require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';

// Carica variabili d'ambiente se disponibili
if (file_exists(__DIR__ . '/.env')) {
    $dotenv = \Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->load();
}

use FusionERP\Shared\Database;

$oldTenant = 'TNT_default';
$newTenant = 'TNT_fusion';

try {
    $db = Database::getInstance();
    $db->beginTransaction();

    echo "🔍 Inizio riconciliazione sponsor...\n";

    // 1. Conta gli sponsor attuali
    $countStmt = $db->prepare("SELECT COUNT(*) FROM societa_sponsors WHERE tenant_id = ?");
    $countStmt->execute([$oldTenant]);
    $oldCount = $countStmt->fetchColumn();

    if ($oldCount === 0) {
        echo "ℹ️ Nessun sponsor trovato nel tenant {$oldTenant}. Controllo se sono già in {$newTenant}...\n";
    } else {
        echo "✅ Trovati {$oldCount} sponsor nel tenant {$oldTenant}. Inizio migrazione a {$newTenant}...\n";

        // 2. Migrazione record
        $updateStmt = $db->prepare("
            UPDATE societa_sponsors 
            SET tenant_id = ?, 
                is_active = 1, 
                is_deleted = 0 
            WHERE tenant_id = ?
        ");
        $updateStmt->execute([$newTenant, $oldTenant]);
        echo "👉 Record spostati correttamente.\n";

        // 3. Aggiornamento logo_path
        $sponsors = $db->query("SELECT id, logo_path FROM societa_sponsors WHERE tenant_id = '{$newTenant}' AND logo_path IS NOT NULL")->fetchAll(PDO::FETCH_ASSOC);
        $updatePathStmt = $db->prepare("UPDATE societa_sponsors SET logo_path = ? WHERE id = ?");

        $movedFiles = 0;
        foreach ($sponsors as $s) {
            if (str_contains($s['logo_path'], $oldTenant)) {
                $newPath = str_replace($oldTenant, $newTenant, $s['logo_path']);
                
                // Opzionale: prova a spostare fisicamente il file se siamo sul server
                $oldFile = __DIR__ . '/' . ltrim($s['logo_path'], '/');
                $newFile = __DIR__ . '/' . ltrim($newPath, '/');
                
                $targetDir = dirname($newFile);
                if (!is_dir($targetDir)) {
                    mkdir($targetDir, 0755, true);
                }

                if (file_exists($oldFile)) {
                    if (rename($oldFile, $newFile)) {
                        $movedFiles++;
                    }
                }

                $updatePathStmt->execute([$newPath, $s['id']]);
            }
        }
        echo "📂 Percorsi logo aggiornati (File spostati fisicamente: {$movedFiles}).\n";
    }

    // 4. Verifica finale
    $finalCountStmt = $db->prepare("SELECT COUNT(*) FROM societa_sponsors WHERE tenant_id = ? AND is_active = 1");
    $finalCountStmt->execute([$newTenant]);
    $finalCount = $finalCountStmt->fetchColumn();

    echo "🏆 Fine! Totale sponsor attivi in {$newTenant}: {$finalCount}\n";

    $db->commit();
    echo "\n\n✅ DISPLEGAMENTO COMPLETATO CON SUCCESSO. Ricordati di caricare questo file e SocietaController.php sul server e di eseguirlo.\n";

} catch (\Exception $e) {
    if (isset($db)) $db->rollBack();
    echo "❌ ERRORE: " . $e->getMessage() . "\n";
    exit(1);
}
