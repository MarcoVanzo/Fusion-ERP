<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Database.php';

try {
    // Manually instantiate OutSeasonController and call getVerification 
    // without invoking Auth mechanisms for a public test
    $pdo = FusionERP\Shared\Database::getInstance();
    $stmt = $pdo->prepare(
        'SELECT entry_name, found, confidence, transaction_date,
                transaction_amount, transaction_description, notes, verified_at
         FROM outseason_verifications
         WHERE season_key = :season_key
         ORDER BY entry_name'
    );
    $stmt->execute([':season_key' => '2026']);
    $rows = $stmt->fetchAll();
    
    // Simulate Response::success exact structure
    $res = [
        'success' => true,
        'data' => [
            'season_key' => '2026',
            'results' => $rows
        ]
    ];
    header('Content-Type: application/json');
    echo json_encode($res, JSON_PRETTY_PRINT);
} catch(Exception $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
