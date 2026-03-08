<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();
require_once 'api/Shared/Database.php';

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT COUNT(*) FROM athletes");
    echo "Total Athletes: " . $stmt->fetchColumn() . "\n";

    $stmt2 = $db->query("SELECT * FROM athletes LIMIT 1");
    $athlete = $stmt2->fetch(PDO::FETCH_ASSOC);
    if ($athlete) {
        echo "Found athlete from tenant: " . $athlete['tenant_id'] . "\n";
    }
}
catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}