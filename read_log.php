<?php
$logFile = __DIR__ . '/api/local_debug_error.log';
if (file_exists($logFile)) {
    echo "--- local_debug_error.log ---\n";
    $lines = file($logFile);
    // Print last 20 lines
    echo implode("", array_slice($lines, -20));
} else {
    echo "No debug log found.\n";
}

$phpLog = ini_get('error_log');
if ($phpLog && file_exists($phpLog)) {
    echo "\n\n--- PHP error_log ($phpLog) ---\n";
    $lines = file($phpLog);
    echo implode("", array_slice($lines, -20));
} else {
    echo "\n\nNo PHP error_log found or configured.\n";
}
