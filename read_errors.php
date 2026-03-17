<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$logFile = '/web/htdocs/www.fusionteamvolley.it/home/ERP/php_errors.log';
// Since I don't know the exact php error log path, I'll force it to a local file for this request
ini_set('error_log', __DIR__ . '/my_debug.log');

require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';

echo "Testing getEnvVar...\n";
$rc = new ReflectionClass('FusionERP\Modules\Scouting\ScoutingController');
$method = $rc->getMethod('getEnvVar');
$method->setAccessible(true);
$val = $method->invoke(null, 'SCOUTING_FUSION_FORM_ID');
var_dump($val);

echo "\n--- log contents ---\n";
if (file_exists(__DIR__ . '/my_debug.log')) {
    echo file_get_contents(__DIR__ . '/my_debug.log');
} else {
    echo "No log generated.";
}
