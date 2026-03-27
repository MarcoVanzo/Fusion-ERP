<?php
header('Content-Type: text/plain');
$envPath = __DIR__ . '/.env';
echo "File exists: " . (file_exists($envPath) ? 'yes' : 'no') . "\n";
$envContent = @file_get_contents($envPath);
echo "File size: " . strlen($envContent) . "\n";
if (preg_match('/^GEMINI_API_KEY=(.*)$/m', $envContent, $m)) {
    echo "Regex matched key: " . trim($m[1], " \t\n\r\0\x0B\"'") . "\n";
} else {
    echo "Regex failed.\n";
}
echo "ENV key: " . ($_ENV['GEMINI_API_KEY'] ?? 'null') . "\n";
echo "SERVER key: " . ($_SERVER['GEMINI_API_KEY'] ?? 'null') . "\n";
echo "getenv key: " . getenv('GEMINI_API_KEY') . "\n";
