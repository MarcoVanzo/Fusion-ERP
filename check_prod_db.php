<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

try {
    $db = \FusionERP\Shared\Database::getInstance();
    
    // Prova ad accedere alla tabella per vedere che campi ci sono
    $stmt1 = $db->query("DESCRIBE federation_matches");
    $fields1 = $stmt1->fetchAll(\PDO::FETCH_ASSOC);
    
    $stmt2 = $db->query("DESCRIBE federation_standings");
    $fields2 = $stmt2->fetchAll(\PDO::FETCH_ASSOC);
    
    $missing_matches = [];
    $all1 = array_column($fields1, 'Field');
    if (!in_array('home_logo', $all1)) $missing_matches[] = 'home_logo';
    if (!in_array('away_logo', $all1)) $missing_matches[] = 'away_logo';
    
    $missing_standings = [];
    $all2 = array_column($fields2, 'Field');
    if (!in_array('logo', $all2)) $missing_standings[] = 'logo';
    
    $alter_results = [];
    
    if (!empty($missing_matches)) {
        try {
            if (in_array('home_logo', $missing_matches)) $db->exec("ALTER TABLE federation_matches ADD COLUMN home_logo VARCHAR(300) NULL AFTER home_team");
            if (in_array('away_logo', $missing_matches)) $db->exec("ALTER TABLE federation_matches ADD COLUMN away_logo VARCHAR(300) NULL AFTER away_team");
            $alter_results[] = "Matches table altered.";
        } catch (\Exception $e) {
            $alter_results[] = "Matches error: " . $e->getMessage();
        }
    }
    
    if (!empty($missing_standings)) {
        try {
            $db->exec("ALTER TABLE federation_standings ADD COLUMN logo VARCHAR(300) NULL AFTER team");
            $alter_results[] = "Standings table altered.";
        } catch (\Exception $e) {
            $alter_results[] = "Standings error: " . $e->getMessage();
        }
    }

    echo json_encode([
        "success" => true, 
        "matches_fields" => $all1, 
        "standings_fields" => $all2, 
        "alters" => $alter_results
    ]);

} catch (\Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
