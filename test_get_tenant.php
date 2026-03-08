<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();
require_once 'api/Shared/Database.php';

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT tenant_id, count(*) as c FROM athletes GROUP BY tenant_id");
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($res);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
