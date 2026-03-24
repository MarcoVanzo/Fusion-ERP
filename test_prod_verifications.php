<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $pdo = FusionERP\Shared\Database::getInstance();
    $stmt = $pdo->query('SELECT * FROM outseason_verifications ORDER BY verified_at DESC LIMIT 10');
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($res)) {
        header('Content-Type: application/json');
        echo json_encode(["status" => "empty"]);
    } else {
        header('Content-Type: application/json');
        echo json_encode(["status" => "found", "data" => $res]);
    }
} catch(Exception $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
