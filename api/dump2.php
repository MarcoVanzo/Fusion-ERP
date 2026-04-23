<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->prepare("SELECT id, first_name, last_name, vald_profile_id FROM athletes WHERE last_name LIKE '%Olmesini%'");
$stmt->execute();
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($data)) {
    echo "NO OLMESINI IN DB!";
} else {
    $athleteId = $data[0]['id'];
    $stmt = $db->prepare("SELECT * FROM vald_test_results WHERE athlete_id = ? ORDER BY test_date DESC");
    $stmt->execute([$athleteId]);
    $tests = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "---- Tests for Olmesini ----\n";
    foreach ($tests as $t) {
        echo "{$t['test_date']} | {$t['test_type']} | {$t['metrics']}\n";
    }
}
