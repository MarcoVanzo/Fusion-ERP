<?php
declare(strict_types=1);

$env = file_get_contents(__DIR__ . '/.env');
preg_match('/GEMINI_TOKEN=(.*)/', $env, $m);
$apiKey = trim($m[1], " '\"");

$model = 'gemini-flash-latest';
$url = "https://generativelanguage.googleapis.com/v1beta/models/$model:generateContent?key=" . $apiKey;

$payload = [
    'contents' => [['parts' => [['text' => 'Ciao, chi sei?']]]]
];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
