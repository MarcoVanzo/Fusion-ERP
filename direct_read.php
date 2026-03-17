<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

function manualEnvDump() {
    $envFile = realpath(__DIR__ . '/.env');
    if (!$envFile || !file_exists($envFile)) {
        echo "Missing .env at expected path.\n";
        return;
    }

    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $foundKeys = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $foundKeys[] = trim($parts[0]);
        }
    }
    
    echo "Found " . count($foundKeys) . " keys in .env:\n";
    echo implode(", ", $foundKeys) . "\n";
    
    $checkKeys = ['SCOUTING_FUSION_FORM_ID', 'SCOUTING_NETWORK_FORM_ID'];
    foreach ($checkKeys as $k) {
        echo "$k present? " . (in_array($k, $foundKeys) ? "YES" : "NO") . "\n";
    }
}

manualEnvDump();

require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';
$rc = new ReflectionClass('FusionERP\Modules\Scouting\ScoutingController');
$method = $rc->getMethod('getEnvVar');
$method->setAccessible(true);
echo "\nValue of SCOUTING_FUSION_FORM_ID from ScoutingController: ";
var_dump($method->invoke(null, 'SCOUTING_FUSION_FORM_ID'));
