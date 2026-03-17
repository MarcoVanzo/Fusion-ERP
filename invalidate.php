<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$fileToInvalidate = '/web/htdocs/www.fusionteamvolley.it/home/ERP/api/Modules/Scouting/ScoutingController.php';

if (function_exists('opcache_invalidate')) {
    $success = opcache_invalidate($fileToInvalidate, true);
    echo "opcache_invalidate for ScoutingController: " . ($success ? "SUCCESS" : "FAILED") . "\n";
} else {
    echo "opcache_invalidate is NOT available.\n";
}

// Optionally dump OPcache status
if (function_exists('opcache_get_status')) {
    $status = opcache_get_status(false);
    echo "OPcache is " . ($status['opcache_enabled'] ? "ENABLED" : "DISABLED") . "\n";
}
