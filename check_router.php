<?php
$file = __DIR__ . '/js/core/router.js';
if (file_exists($file)) {
    echo "Content of router.js (first 500 chars):\\n";
    echo substr(file_get_contents($file), 0, 500);
    echo "\\n\\nContent of router.js (last 500 chars):\\n";
    echo substr(file_get_contents($file), -500);
} else {
    echo "File not found.";
}
