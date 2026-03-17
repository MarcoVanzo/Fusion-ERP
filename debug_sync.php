<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';

use FusionERP\Modules\Scouting\ScoutingController;

echo "--- Debug Sync ---\n";
try {
    $result = ScoutingController::_doSync();
    print_r($result);
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n" . $e->getTraceAsString();
} catch (Error $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
