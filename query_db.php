<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->load();
require 'api/Shared/Database.php';

use FusionERP\Shared\Database;
$db = Database::getInstance();

$stmt = $db->query("SELECT * FROM scouting_athletes LIMIT 1");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($rows);
