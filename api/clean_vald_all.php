<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->prepare("DELETE FROM vald_test_results");
$stmt->execute();
$count = $stmt->rowCount();

echo "Eliminati $count test in totale da tutto il database ERP.";
