<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/Shared/Database.php';

$db = FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT COUNT(*) FROM athletes");
echo "Total Athletes: " . $stmt->fetchColumn() . "\n";

$stmt2 = $db->query("SELECT COUNT(*) FROM athletes a JOIN teams t ON a.team_id = t.id");
echo "Athletes with valid teams: " . $stmt2->fetchColumn() . "\n";

$stmt3 = $db->query("SELECT team_id, COUNT(*) as c FROM athletes GROUP BY team_id");
echo "Team IDs in athletes:\n";
while ($row = $stmt3->fetch()) {
    echo $row['team_id'] . ": " . $row['c'] . "\n";
}

$stmt4 = $db->query("SELECT id FROM teams");
echo "Valid Teams IDs:\n";
while ($row = $stmt4->fetch()) {
    echo $row['id'] . "\n";
}