<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OPcache flushed successfully.\n";
} else {
    echo "OPcache is not enabled or not available.\n";
}
