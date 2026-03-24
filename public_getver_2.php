<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

try {
    $db = Database::getInstance();
    
    $stmt = $db->prepare('SELECT * FROM outseason_verifications WHERE season_key = "2026"');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    header('Content-Type: application/json');
    echo json_encode(["total" => count($rows), "rows" => $rows], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    header('Content-Type: application/json');
    echo json_encode(["error" => $e->getMessage()]);
}
