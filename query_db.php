<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->load();
require 'api/Shared/Database.php';

use FusionERP\Shared\Database;
$db = Database::getInstance();

$stmt = $db->query("SELECT athlete_id, tenant_id FROM vald_test_results LIMIT 5");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($rows);
