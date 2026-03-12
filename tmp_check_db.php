<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Shared\Database;
$db = Database::getInstance();

$stmt = $db->query("SELECT id, full_name, vald_athlete_id FROM athletes WHERE vald_athlete_id IS NOT NULL AND vald_athlete_id != ''");
$athletes = $stmt->fetchAll();
print_r($athletes);
