<?php
require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';

$rc = new ReflectionClass('FusionERP\Modules\Scouting\ScoutingController');
$envFile = dirname($rc->getFileName(), 4) . '/.env'; 

echo "Checking envFile: $envFile\n";
if (!file_exists($envFile)) die("NOT FOUND");

$lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
echo "Lines found: " . count($lines) . "\n";

foreach (array_slice($lines, -15) as $line) {
    $line = trim($line);
    if ($line === '' || $line[0] === '#') continue;
    $parts = explode('=', $line, 2);
    
    $keyRaw = $parts[0] ?? '';
    $keyTrim = trim($keyRaw);
    
    if (strpos($keyTrim, 'SCOUTING') !== false) {
        $keyLen = strlen($keyTrim);
        echo "Found Key: '$keyTrim' (Len: $keyLen) -> Match? " . (($keyTrim === 'SCOUTING_FUSION_FORM_ID') ? 'YES' : 'NO') . "\n";
    }
}
