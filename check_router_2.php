<?php
$file = __DIR__ . '/js/core/router.js';
if (file_exists($file)) {
    $content = file_get_contents($file);
    if (strpos($content, 'scouting-database') !== false) {
        echo "YES: scouting-database IS in router.js on the server.\\n";
    } else {
        echo "NO: scouting-database IS NOT in router.js on the server.\\n";
    }
} else {
    echo "File not found.";
}
