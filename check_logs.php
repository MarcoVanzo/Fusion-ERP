<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$logFile = __DIR__ . '/api/logs/error.log';
if (file_exists($logFile)) {
    $lines = file($logFile);
    $lastLines = array_slice($lines, -10);
    echo "Last 10 lines of error.log:\\n";
    foreach ($lastLines as $line) {
        echo $line;
    }
} else {
    echo "error.log not found.\\n";
}
