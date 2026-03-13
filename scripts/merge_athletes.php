<?php
/**
 * Script to find and merge duplicate athlete records.
 * Identifies duplicates by LOWER(first_name), LOWER(last_name), and tenant_id.
 * Merges all related records in 20 tables to a primary athlete, and deletes the redundant ones.
 */

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

$db = Database::getInstance();
$db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

// The tables that have an `athlete_id` column referencing the `athletes` table.
$relatedTables = [
    'acwr_alerts',
    'ai_summaries',
    'athlete_documents',
    'athlete_teams',
    'athletic_metrics',
    'biometric_records',
    'carpool_passengers',
    'contacts',
    'event_attendees',
    'federation_cards',
    'gdpr_consents',
    'guardians',
    'injury_records',
    'medical_certificates',
    'metrics_logs',
    'notification_log',
    'payment_plans',
    'transactions',
    'vald_test_results',
    'whatsapp_messages',
];

echo "[*] Iniziando procedura di merge atleti duplicati...\n";

// Find duplicates (group by normalized name and tenant_id)
$stmt = $db->query("
    SELECT tenant_id, LOWER(first_name) as fname, LOWER(last_name) as lname, COUNT(*) as c
    FROM athletes
    GROUP BY tenant_id, LOWER(first_name), LOWER(last_name)
    HAVING c > 1
");

$duplicateGroups = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($duplicateGroups)) {
    echo "[*] Nessun atleta duplicato trovato.\n";
    exit(0);
}

echo "[*] Trovati " . count($duplicateGroups) . " gruppi di atleti duplicati.\n";

$totalMerged = 0;
$totalDeleted = 0;

$db->beginTransaction();

try {
    foreach ($duplicateGroups as $group) {
        $tenantId = $group['tenant_id'];
        $fname = $group['fname'];
        $lname = $group['lname'];
        
        echo "\n[*] --- Merge: $fname $lname (Tenant: $tenantId) ---\n";

        // Fetch all athlete records for this duplicate group
        // Prioritize by criteria for selecting the "primary" record
        $stmtAthletes = $db->prepare("
            SELECT * FROM athletes 
            WHERE tenant_id = :tenant_id 
              AND LOWER(first_name) = :fname 
              AND LOWER(last_name) = :lname
        ");
        $stmtAthletes->execute([
            ':tenant_id' => $tenantId,
            ':fname' => $fname,
            ':lname' => $lname
        ]);
        
        $athletes = $stmtAthletes->fetchAll(PDO::FETCH_ASSOC);
        
        if (count($athletes) <= 1) {
            continue; // Safety check
        }

        // --- Determine Primary Athlete ---
        // Score each athlete record to pick the best primary
        $primaryAthlete = null;
        $highestScore = -1;

        foreach ($athletes as $a) {
            $score = 0;
            // Active profiles are heavily preferred
            if (empty($a['deleted_at'])) $score += 1000;
            // Has VALD ID? Huge plus.
            if (!empty($a['vald_athlete_id'])) $score += 100;
            // Has an active email/phone/user_id? Good.
            if (!empty($a['email'])) $score += 50;
            if (!empty($a['phone'])) $score += 20;
            if (!empty($a['user_id'])) $score += 80;
            
            // Older records are slightly preferred as base if everything else is equal
            // (Use negative timestamp so older = higher score)
            $ageScore = strtotime('2030-01-01') - strtotime($a['created_at']);
            // Convert to a small micro-score so it only acts as tiebreaker
            $score += ($ageScore / 100000000);

            if ($score > $highestScore) {
                $highestScore = $score;
                $primaryAthlete = $a;
            }
        }

        $primaryId = $primaryAthlete['id'];
        echo "  [+] Selezionato Primario: $primaryId (creato: {$primaryAthlete['created_at']})\n";

        // Filter out redundant ones
        $redundantIds = [];
        foreach ($athletes as $a) {
            if ($a['id'] !== $primaryId) {
                $redundantIds[] = $a['id'];
            }
        }

        if (empty($redundantIds)) continue;

        echo "  [-] Redundanti: " . implode(', ', $redundantIds) . "\n";

        // --- Merge the data ---
        // 1. Update fields in primary if they are empty but present in redundant
        $updates = [];
        $params = [':pid' => $primaryId];
        
        $fieldsToMerge = [
            'birth_date', 'birth_place', 'residence_address', 'residence_city',
            'phone', 'email', 'parent_contact', 'identity_document', 'fiscal_code',
            'medical_cert_expires_at', 'federal_id', 'height_cm', 'weight_kg',
            'photo_path', 'clothing_size', 'shoe_size', 'jersey_number', 'role',
            'user_id'
        ];

        foreach ($redundantIds as $rid) {
            $redundantAthlete = array_filter($athletes, fn($a) => $a['id'] === $rid)[0];
            
            foreach ($fieldsToMerge as $field) {
                // If primary is empty, but redundant has a value, take it
                if (empty($primaryAthlete[$field]) && !empty($redundantAthlete[$field])) {
                    $primaryAthlete[$field] = $redundantAthlete[$field];
                    $updates[] = "$field = :$field";
                    $params[":$field"] = $redundantAthlete[$field];
                    echo "    -> Ereditato $field: {$redundantAthlete[$field]}\n";
                }
            }
        }

        if (!empty($updates)) {
            $sql = "UPDATE athletes SET " . implode(', ', $updates) . " WHERE id = :pid";
            $updateStmt = $db->prepare($sql);
            $updateStmt->execute($params);
        }

        // 2. Migrate related data in other tables
        foreach ($redundantIds as $rid) {
            foreach ($relatedTables as $table) {
                // Determine if table has a composite primary key or unique index that might clash.
                // IGNORE is used so that if primary athlete is already in the table 
                // (e.g., same team in `athlete_teams`), the update is skipped and 
                // the redundant record's link is left behind to be cascadingly deleted.
                $sql = "UPDATE IGNORE $table SET athlete_id = :pid WHERE athlete_id = :rid";
                $migStmt = $db->prepare($sql);
                $migStmt->execute([':pid' => $primaryId, ':rid' => $rid]);
                if ($migStmt->rowCount() > 0) {
                    echo "    -> Migrati {$migStmt->rowCount()} record dalla tabella '$table'\n";
                }
            }
        }

        // 3. Delete redundant athletes (foreign key cascades will clear un-migratable clashing links)
        $inList = implode(',', array_fill(0, count($redundantIds), '?'));
        $delStmt = $db->prepare("DELETE FROM athletes WHERE id IN ($inList)");
        $delStmt->execute($redundantIds);
        
        $deletedCount = $delStmt->rowCount();
        echo "  [x] Cancellati $deletedCount record atleti ridondanti.\n";
        
        $totalMerged++;
        $totalDeleted += $deletedCount;
    }

    $db->commit();
    echo "\n====== PULIZIA COMPLETATA ======\n";
    echo "Gruppi unificati: $totalMerged\n";
    echo "Profili atleti cancellati: $totalDeleted\n";

} catch (\Exception $e) {
    $db->rollBack();
    echo "\n[!] ERRORE FATALE durante il merge: " . $e->getMessage() . "\n";
    exit(1);
}
