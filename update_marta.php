<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Find Marta Cigana
    $stmt = $db->prepare("SELECT id, first_name, last_name, team_id FROM athletes WHERE first_name LIKE 'Marta' AND last_name LIKE 'Cigana'");
    $stmt->execute();
    $marta = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$marta) {
        die("Marta Cigana not found\n");
    }
    
    // Find Under 18 team
    $stmt2 = $db->prepare("SELECT id, name, category FROM teams WHERE category LIKE '%under%18%' OR name LIKE '%under%18%' LIMIT 1");
    $stmt2->execute();
    $u18 = $stmt2->fetch(PDO::FETCH_ASSOC);
    
    if (!$u18) {
        die("Under 18 team not found\n");
    }
    
    // Update
    $updateStmt = $db->prepare("UPDATE athletes SET team_id = :tid WHERE id = :id");
    $updateStmt->execute([':tid' => $u18['id'], ':id' => $marta['id']]);
    
    echo "Updated " . $marta['first_name'] . " " . $marta['last_name'] . " to team " . $u18['name'] . " (" . $u18['category'] . ")\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
