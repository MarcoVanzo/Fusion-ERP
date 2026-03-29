<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "Start\n";
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/Auth.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';

echo "Autoloaded\n";
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

echo "Dotenv loaded\n";
try {
    $db = \FusionERP\Shared\Database::getInstance();
    echo "DB instance acquired\n";
    $result = \FusionERP\Modules\Scouting\ScoutingController::_doSync();
    echo "Sync done\n";
    print_r($result);
} catch (Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
