<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

function loadEnvFile($path) {
    if (!file_exists($path)) return false;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $vars = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $eqPos = strpos($line, '=');
        if ($eqPos === false) continue;
        $key = trim(substr($line, 0, $eqPos));
        $value = trim(substr($line, $eqPos + 1));
        putenv("$key=$value");
    }
    return true;
}

loadEnvFile(__DIR__ . '/.env');

echo "ENV CHECK:\n";
echo "SCOUTING_FUSION_FORM_ID = " . getenv('SCOUTING_FUSION_FORM_ID') . "\n";
echo "SCOUTING_FUSION_API_KEY = " . (getenv('SCOUTING_FUSION_API_KEY') ? 'SET (' . strlen(getenv('SCOUTING_FUSION_API_KEY')) . ' chars)' : 'NOT SET') . "\n";
echo "SCOUTING_NETWORK_FORM_ID = " . getenv('SCOUTING_NETWORK_FORM_ID') . "\n";
echo "SCOUTING_NETWORK_API_KEY = " . (getenv('SCOUTING_NETWORK_API_KEY') ? 'SET (' . strlen(getenv('SCOUTING_NETWORK_API_KEY')) . ' chars)' : 'NOT SET') . "\n";
echo "\n--- Testing Cognito API for Fusion (Form 9) ---\n";

$apiKey = getenv('SCOUTING_FUSION_API_KEY');
$url = 'https://www.cognitoforms.com/api/odata/Forms(9)/Views(1)/Entries';

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $apiKey,
        'Accept: application/json',
    ],
    CURLOPT_TIMEOUT => 30,
]);
$response = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
if ($curlError) echo "cURL Error: $curlError\n";

if ($httpCode === 200) {
    $decoded = json_decode($response, true);
    $entries = $decoded['value'] ?? [];
    echo "Entries found: " . count($entries) . "\n";
    if (!empty($entries)) {
        echo "First entry keys: " . implode(', ', array_keys($entries[0])) . "\n";
        echo "First entry sample:\n";
        print_r($entries[0]);
    }
} else {
    echo "Response: " . substr($response, 0, 500) . "\n";
}
