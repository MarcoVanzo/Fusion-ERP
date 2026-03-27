<?php
require_once __DIR__ . '/../vendor/autoload.php';
use FusionERP\Shared\AIService;
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

header('Content-Type: text/plain');
try {
    echo "Testing Gemini Connection...\n";
    echo "Model: gemini-flash-latest\n";
    $token = $_ENV['GEMINI_TOKEN'] ?? 'MISSING';
    echo "Token (8 chars): " . substr($token, 0, 8) . "...\n";
    
    $res = AIService::generateContent("Rispondi con OK", "gemini-flash-latest");
    echo "Response: " . $res . "\n";
    echo "SUCCESS!\n";
} catch (\Exception $e) {
    echo "FAILURE: " . $e->getMessage() . "\n";
}
?>
