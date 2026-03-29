<?php
require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap environment to load ENV variables properly like router.php does
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

// Let's connect to DB
try {
    \FusionERP\Shared\Database::getInstance();
    $result = \FusionERP\Modules\Scouting\ScoutingController::_doSync();
    print_r($result);
} catch (Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
