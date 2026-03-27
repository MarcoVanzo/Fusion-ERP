<?php
header('Content-Type: text/plain');
if (function_exists('opcache_reset')) {
    echo "OPcache Reset: " . (opcache_reset() ? 'Success' : 'Failed') . "\n";
} else {
    echo "OPcache is not enabled or function does not exist.\n";
}
if (function_exists('apcu_clear_cache')) {
    echo "APCu Reset: " . (apcu_clear_cache() ? 'Success' : 'Failed') . "\n";
}
