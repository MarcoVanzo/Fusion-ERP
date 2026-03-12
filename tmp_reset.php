<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OPcache reset successfully.\n";
} else {
    echo "OPcache is not enabled or not available.\n";
}
if (function_exists('apcu_clear_cache')) {
    apcu_clear_cache();
    echo "APCu cache reset successfully.\n";
}
