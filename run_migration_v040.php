<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once 'api/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $sql = file_get_contents('db/migrations/V040__ec_orders.sql');
    $db->exec($sql);
    echo "Migration V040 executed successfully.\n";
}
catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}