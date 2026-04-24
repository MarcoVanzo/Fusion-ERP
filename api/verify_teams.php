<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once __DIR__ . '/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Get all team_seasons for TEAM_u16a
    $stmt = $db->prepare("SELECT ts.id, ts.team_id, ts.season, t.name FROM team_seasons ts JOIN teams t ON t.id = ts.team_id WHERE ts.team_id = 'TEAM_u16a'");
    $stmt->execute();
    $teamSeasons = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Team seasons for TEAM_u16a in production:\n";
    print_r($teamSeasons);
    
    // Check all athlete_teams for Emma
    $stmt2 = $db->prepare("SELECT * FROM athlete_teams WHERE athlete_id = 'ATH_c16fcee1'");
    $stmt2->execute();
    $athleteTeams = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Athlete_teams for Emma:\n";
    print_r($athleteTeams);
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
