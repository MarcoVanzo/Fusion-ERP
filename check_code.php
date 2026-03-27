<?php
header('Content-Type: text/plain');
$content = file_get_contents(__DIR__ . '/api/Modules/Transport/TransportController.php');
if (strpos($content, 'preg_match(\'/^GEMINI_API_KEY=(.*)$/m\'') !== false) {
    echo "NEW CODE IS DEPLOYED\n";
} else {
    echo "OLD CODE IS RUNNING\n";
}
echo "Key Prefix output snippet:\n";
$pos = strpos($content, '$keyUsed');
if ($pos !== false) {
    echo substr($content, $pos - 40, 300);
} else {
    echo "NO keyUsed Variable found\n";
}
