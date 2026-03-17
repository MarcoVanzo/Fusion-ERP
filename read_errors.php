<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$logFile = '/web/htdocs/www.fusionteamvolley.it/home/ERP/my_debug.log';
if (file_exists($logFile)) {
    unlink($logFile);
}
ini_set('error_log', $logFile);

if (function_exists('opcache_reset')) opcache_reset();

require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';

echo "Testing getEnvVar...\n";
$rc = new ReflectionClass('FusionERP\Modules\Scouting\ScoutingController');
$method = $rc->getMethod('getEnvVar');
$method->setAccessible(true);
$val = $method->invoke(null, 'SCOUTING_FUSION_FORM_ID');
var_dump($val);

echo "\n--- log contents ---\n";
if (file_exists($logFile)) {
    echo file_get_contents($logFile);
} else {
    echo "No log generated.";
}
