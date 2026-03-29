<?php
require_once __DIR__ . '/api/bootstrap.php';
use FusionERP\Modules\Scouting\ScoutingController;

try {
    $result = ScoutingController::_doSync();
    print_r($result);
} catch (Throwable $e) {
    echo "Exception: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
