<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $pdo = FusionERP\Shared\Database::getInstance();
    $stmt = $pdo->query('SELECT tenant_id, season_key, cognito_id, nome_e_cognome FROM outseason_entries LIMIT 10');
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(["status" => "success", "data" => $rows]);
} catch (\Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
