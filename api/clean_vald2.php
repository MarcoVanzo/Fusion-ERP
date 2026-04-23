<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->prepare("DELETE FROM vald_test_results WHERE athlete_id = 'ATH_f4016c19'");
$stmt->execute();
$count = $stmt->rowCount();

echo "Eliminati $count test per re-importare Olmesini con le metriche corrette.";
