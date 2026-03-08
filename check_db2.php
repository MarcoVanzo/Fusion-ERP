<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

header('Content-Type: application/json');

try {
    $db = Database::getInstance();
    $stmt = $db->query("SHOW CREATE TABLE users");
    $usersSchema = $stmt->fetch(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'schema' => $usersSchema]);
} catch (Throwable $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}