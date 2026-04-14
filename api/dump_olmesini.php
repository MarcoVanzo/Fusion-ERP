<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

$db = \FusionERP\Shared\Database::getInstance();

$stmt = $db->prepare("SELECT id FROM athletes WHERE first_name LIKE '%Angelica%' AND last_name LIKE '%Olmesini%'");
$stmt->execute();
$athleteId = $stmt->fetchColumn();

if (!$athleteId) {
    echo "Olmesini not found";
    exit;
}

$stmt = $db->prepare("SELECT test_date, test_type, metrics FROM vald_test_results WHERE athlete_id = ? ORDER BY test_date DESC LIMIT 10");
$stmt->execute([$athleteId]);
$tests = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Tests for athlete $athleteId:\n";
print_r($tests);
