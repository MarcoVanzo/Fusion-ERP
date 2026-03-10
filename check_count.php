<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

$db = Database::getInstance();
$stmt = $db->query('SELECT COUNT(*) FROM athlete_teams');
echo "Count: " . $stmt->fetchColumn() . "\n";

$stmt = $db->query('SELECT * FROM athlete_teams LIMIT 3');
print_r($stmt->fetchAll());