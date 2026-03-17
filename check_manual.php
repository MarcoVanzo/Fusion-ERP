<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

function manualEnv($key) {
    if (!file_exists(__DIR__ . '/.env')) return null;
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $parts = explode('=', $line, 2);
        if (trim($parts[0]) === $key) return trim($parts[1]);
    }
    return null;
}

echo "Manual Parsing test:\n";
echo "SCOUTING_FUSION_FORM_ID = " . manualEnv('SCOUTING_FUSION_FORM_ID') . "\n";
echo "SCOUTING_FUSION_API_KEY = " . (strlen(manualEnv('SCOUTING_FUSION_API_KEY') ?: '') > 10 ? 'SET (length: ' . strlen(manualEnv('SCOUTING_FUSION_API_KEY')) . ')' : 'NOT SET') . "\n";
