<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT count(*) FROM metrics_logs");
echo "metrics_logs count: " . $stmt->fetchColumn() . "\n";

$stmt2 = $db->query("SELECT count(*) FROM vald_test_results");
echo "vald_test_results count: " . $stmt2->fetchColumn() . "\n";
