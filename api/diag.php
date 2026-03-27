<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

header('Content-Type: text/plain');
echo "GEMINI_TOKEN present: " . (isset($_ENV['GEMINI_TOKEN']) ? "YES" : "NO") . "\n";
echo "GEMINI_TOKEN length: " . (isset($_ENV['GEMINI_TOKEN']) ? strlen($_ENV['GEMINI_TOKEN']) : 0) . "\n";
echo "GEMINI_TOKEN start: " . (isset($_ENV['GEMINI_TOKEN']) ? substr($_ENV['GEMINI_TOKEN'], 0, 8) : "N/A") . "\n";
echo "Current Model: gemini-flash-latest\n";
?>
