<?php
require_once __DIR__ . '/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Check if Emma is in DB
    $stmt = $db->prepare("SELECT id, first_name, last_name, is_active, deleted_at FROM athletes WHERE first_name LIKE '%Emma%' AND last_name LIKE '%Romanel%'");
    $stmt->execute();
    $athletes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Current athletes matching Emma Romanel:\n";
    print_r($athletes);
    
    if (empty($athletes)) {
        echo "\nEmma Romanel not found. Inserting her...\n";
        
        $sql = "INSERT INTO athletes (id, team_id, first_name, last_name, role, birth_date, birth_place, residence_address, residence_city, fiscal_code, identity_document, email, phone, parent_contact, parent_phone, shirt_size, is_active, tenant_id, created_at, updated_at) 
                VALUES ('ATH_c16fcee1', 'TEAM_u16a', 'Emma', 'Romanel', 'Centrale', '2011-07-26', 'Udine', 'Via E. Feletti, 22', 'Colle Umberto (TV)', 'RMNMME11L66L483F', 'CA49010VU', NULL, NULL, NULL, NULL, 'M', 1, 'TNT_default', NOW(), NOW())";
                
        $db->exec($sql);
        echo "Successfully inserted Emma Romanel (ATH_c16fcee1).\n";
        
        // Ensure she is in athlete_teams
        $db->exec("INSERT IGNORE INTO athlete_teams (athlete_id, team_season_id) VALUES ('ATH_c16fcee1', 'TS_329e0ff21d9511f')");
        echo "Successfully inserted into athlete_teams.\n";
    } else {
        // If she is deleted, restore her
        foreach ($athletes as $a) {
            if ($a['deleted_at'] !== null) {
                $db->exec("UPDATE athletes SET deleted_at = NULL, is_active = 1 WHERE id = '{$a['id']}'");
                echo "Restored deleted athlete {$a['id']}.\n";
            }
        }
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
