<?php
$envContent = file_get_contents(__DIR__ . '/.env');
$lines = explode("\n", $envContent);
echo "--- Last 15 lines of .env ---\n";
foreach (array_slice($lines, -15) as $line) {
    if (strpos($line, 'API_KEY') !== false || strpos($line, 'PASS') !== false) {
        $parts = explode('=', $line, 2);
        echo $parts[0] . "=***HIDDEN***\n";
    } else {
        echo $line . "\n";
    }
}
