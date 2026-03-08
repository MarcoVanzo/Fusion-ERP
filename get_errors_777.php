<?php
$logPath = ini_get('error_log');
echo "Configured error_log path: " . $logPath . "\n";

if ($logPath && file_exists($logPath)) {
    echo "File size: " . filesize($logPath) . " bytes\n\n";
    // Get last 500 lines
    $lines = file($logPath);
    if ($lines !== false) {
        $lastLines = array_slice($lines, -500);
        foreach ($lastLines as $line) {
            echo $line;
        }
    }
    else {
        echo "Could not read file.\n";
    }
}
else {
    echo "Log file not found or not accessible.\n";

    // Try some common alternative locations
    $alts = [
        __DIR__ . '/error_log',
        __DIR__ . '/php_errorlog',
        '/var/log/apache2/error.log',
        '/var/log/httpd/error_log'
    ];
    foreach ($alts as $alt) {
        if (file_exists($alt)) {
            echo "\nFound alternative: $alt (" . filesize($alt) . " bytes)\n";
            $lines = file($alt);
            if ($lines !== false) {
                $lastLines = array_slice($lines, -100);
                foreach ($lastLines as $line) {
                    echo $line;
                }
            }
        }
    }
}