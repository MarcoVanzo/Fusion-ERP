<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $pdo = FusionERP\Shared\Database::getInstance();
    $stmt = $pdo->query('SHOW CREATE TABLE outseason_entries');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "schema" => $rows]);
} catch (\Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
