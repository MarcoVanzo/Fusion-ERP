<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();
$db = \FusionERP\Shared\Database::getInstance();

$athleteId = 'ATH_f4016c19';
$stmt = $db->prepare("SELECT test_date, test_type, metrics FROM vald_test_results WHERE athlete_id = ? ORDER BY test_date DESC");
$stmt->execute([$athleteId]);
$tests = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "DATA_START\n";
echo json_encode($tests, JSON_PRETTY_PRINT);
echo "\nDATA_END\n";
