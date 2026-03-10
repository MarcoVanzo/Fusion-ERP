<?php
require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

$db = Database::getInstance();
$athleteId = $_GET['id'] ?? '';

echo "Checking teams for athlete: $athleteId\n";

$stmt = $db->prepare('SELECT * FROM athlete_teams WHERE athlete_id = :id');
$stmt->execute([':id' => $athleteId]);
$rows = $stmt->fetchAll();

echo "Rows in athlete_teams:\n";
print_r($rows);

$stmt = $db->prepare('SELECT id, team_id FROM athletes WHERE id = :id');
$stmt->execute([':id' => $athleteId]);
$ath = $stmt->fetch();

echo "Athlete primary team_id:\n";
print_r($ath);([':id' => $athleteId]);
$ath = $stmt->fetch();

echo "Athlete primary team_id:\n";
print_r($ath);