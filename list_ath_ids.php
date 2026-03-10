<?php
require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

$db = Database::getInstance();
$stmt = $db->query('SELECT id, full_name, team_id FROM athletes LIMIT 5');
$rows = $stmt->fetchAll();
header('Content-Type: application/json');
echo json_encode($rows, JSON_PRETTY_PRINT);
$stmt = $db->query('SELECT id, full_name, team_id FROM athletes LIMIT 10');
$rows = $stmt->fetchAll();
header('Content-Type: application/json');
echo json_encode($rows, JSON_PRETTY_PRINT);