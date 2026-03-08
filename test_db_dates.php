<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

header('Content-Type: text/plain');
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT id, championship_id, match_date, DATE_FORMAT(match_date, '%d/%m/%Y') as df_date, DATE_FORMAT(match_date, '%H:%i') as df_time FROM federation_matches ORDER BY match_date DESC LIMIT 5");
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($res);
}
catch (Throwable $e) {
    echo 'Error: ' . $e->getMessage();
}