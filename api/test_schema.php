<?php
require_once __DIR__ . '/Shared/Database.php';
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/../');
$dotenv->load();

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_teams'");
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns in staff_teams: " . implode(', ', $cols) . "\n";
    $stmt2 = $db->query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'athlete_teams'");
    $cols2 = $stmt2->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns in athlete_teams: " . implode(', ', $cols2) . "\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
