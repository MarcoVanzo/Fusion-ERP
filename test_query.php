<?php
require_once __DIR__ . '/api/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/api');
$dotenv->load();

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT id, tenant_id, cognito_id, nome_cliente FROM ec_orders ORDER BY id DESC LIMIT 20");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($rows);
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}