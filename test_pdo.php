<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $db = FusionERP\Shared\Database::getInstance();
    echo "Connected.\n";
    $stmt = $db->prepare("SELECT COUNT(*) FROM athletes");
    $stmt->execute();
    echo "Count athletes: " . $stmt->fetchColumn() . "\n";
} catch (Exception $e) {
    echo "Exception caught: " . $e->getMessage() . "\n";
}
