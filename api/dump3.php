<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->prepare("SELECT test_date, test_type, metrics FROM vald_test_results WHERE athlete_id = 'ATH_f4016c19' ORDER BY test_date DESC");
$stmt->execute();
$tests = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "---- Tests for ATH_f4016c19 (Olmesini mapped) ----\n";
foreach ($tests as $t) {
    echo "{$t['test_date']} | {$t['test_type']} | {$t['metrics']}\n";
}
