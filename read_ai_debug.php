<?php
$logFile = __DIR__ . '/ai_debug.log';
if (file_exists($logFile)) {
    header('Content-Type: text/plain');
    echo "--- ai_debug.log ---\n";
    echo file_get_contents($logFile);
} else {
    echo "File not found: " . $logFile;
}
$logFile2 = __DIR__ . '/local_debug_error.log';
if (file_exists($logFile2)) {
    echo "\n\n--- local_debug_error.log ---\n";
    echo file_get_contents($logFile2);
}
