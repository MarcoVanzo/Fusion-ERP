<?php
if (function_exists('opcache_reset')) {
    opcache_reset();
    echo "OPcache in RAM svuotata con successo.\n";
} else {
    echo "OPcache non abilitato.\n";
}