<?php
$envFile = __DIR__ . '/.env';
if (!file_exists($envFile)) die("No .env found.");

$lines = file($envFile);
echo "Total lines: " . count($lines) . "\n\n";

foreach ($lines as $idx => $line) {
    $lineNum = $idx + 1;
    $rawLog = trim($line);
    if (strpos($rawLog, '=') !== false && !strpos($rawLog, 'SCOUTING_FUSION_FORM_ID') && !strpos($rawLog, 'SCOUTING_NETWORK_FORM_ID')) {
        $parts = explode('=', $rawLog, 2);
        $rawLog = $parts[0] . '=*';
    }
    
    // Explicitly check for SCOUTING to highlight it
    if (strpos($rawLog, 'SCOUTING') !== false) {
        echo ">>> $lineNum: $rawLog\n";
    } else {
        echo "$lineNum: $rawLog\n";
    }
}
