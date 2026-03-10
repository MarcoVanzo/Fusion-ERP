<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = Database::getInstance();
    $stmt = $db->query("DESCRIBE athletes");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($columns);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
