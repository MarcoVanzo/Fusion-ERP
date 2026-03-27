<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Auth.php';
require_once __DIR__ . '/api/Modules/OutSeason/OutSeasonController.php';

try {
    // Override $_SERVER to fool the session
    $_SERVER['REQUEST_METHOD'] = 'POST';
    FusionERP\Shared\Auth::startSession();

    // Mock user login
    $_SESSION['user'] = [
        'id' => 'admin_test',
        'email' => 'admin@test.com',
        'role' => 'admin',
        'permissions' => []
    ];

    $_GET['module'] = 'outseason';
    $_GET['action'] = 'getVerification';
    $_GET['season_key'] = '2026';

    $controller = new FusionERP\Modules\OutSeason\OutSeasonController();
    $controller->getVerification();
} catch(Exception $e) {
    http_response_code(500);
    echo "Error: " . $e->getMessage();
}
