<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

use FusionERP\Shared\Database;

$db = Database::getInstance();

// Delete tests with empty metrics or tests from March onwards that are corrupted
$stmt = $db->prepare("DELETE FROM vald_test_results WHERE metrics = '{}' OR metrics NOT LIKE '%JumpHeight%'");
$stmt->execute();
$count = $stmt->rowCount();

echo "Eliminati $count test corrotti o vuoti dal database.";
