<?php
require_once __DIR__ . '/debug_sync.php';

$rc = new ReflectionClass('FusionERP\Modules\Scouting\ScoutingController');
echo "\n\n=== PATH TRACE ===\n";
echo "Loaded ScoutingController from: " . $rc->getFileName() . "\n";
$content = file_get_contents($rc->getFileName());
echo "Does it contain getEnvVar? " . (strpos($content, 'getEnvVar') !== false ? "YES" : "NO") . "\n";
echo "Does getEnvVar contain 'realpath'? " . (strpos($content, 'realpath') !== false ? "YES" : "NO") . "\n";
