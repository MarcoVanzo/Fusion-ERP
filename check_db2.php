<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

header('Content-Type: application/json');

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT id, full_name, tenant_id FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $users]);
}
catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}