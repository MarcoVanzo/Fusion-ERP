<?php
header('Content-Type: text/plain');
$envPath = __DIR__ . '/.env';
$envContent = @file_get_contents($envPath);
$apiKey = '';
if (preg_match('/^GEMINI_API_KEY=(.*)$/m', $envContent, $m)) {
    $apiKey = trim($m[1], " \t\n\r\0\x0B\"'");
}

$url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;

$payload = json_encode([
    'contents' => [[
        'parts' => [
            ['text' => 'Test connection.'],
        ],
    ]]
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_TIMEOUT        => 10,
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "API Key extracted: " . substr($apiKey, 0, 10) . "...\n";
echo "HTTP Code: $httpCode\n";
echo "Curl Error: $curlError\n";
echo "Response: $response\n";
