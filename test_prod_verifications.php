<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $pdo = FusionERP\Shared\Database::getInstance();
    $stmt = $pdo->query('SELECT * FROM outseason_verifications ORDER BY updated_at DESC LIMIT 10'); // wait, the column is verified_at
    // let me rewrite the query
    $stmt = $pdo->query('SELECT * FROM outseason_verifications ORDER BY verified_at DESC LIMIT 10');
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($res)) {
        echo "TABLE EXISTS BUT IS EMPTY.\n\n";
    } else {
        echo "FOUND ROWS:\n\n";
        print_r($res);
    }
} catch(Exception $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
