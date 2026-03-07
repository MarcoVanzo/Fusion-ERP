<?php
$cacheDir = __DIR__ . '/cache';
$files = glob($cacheDir . '/fusion_*.json');
$count = 0;
foreach ($files as $f) {
    if (is_file($f)) {
        unlink($f);
        $count++;
    }
}
echo "Cleared $count cache files.";