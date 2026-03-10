<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

$db = Database::getInstance();

// Get some valid athlete and team IDs from the DB
$ath = $db->query('SELECT id FROM athletes LIMIT 1')->fetchColumn();
$team = $db->query('SELECT id FROM teams LIMIT 1')->fetchColumn();

echo "Testing insertion for Athlete: $ath, Team: $team\n";

try {
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $stmt = $db->prepare('INSERT INTO athlete_teams (athlete_id, team_id) VALUES (:aid, :tid)');
    $stmt->execute([':aid' => $ath, ':tid' => $team]);
    echo "SUCCESS\n";
}
catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}