<?php
declare(strict_types=1);

$env = file_get_contents(__DIR__ . '/.env');
preg_match('/GEMINI_TOKEN=(.*)/', $env, $m);
$apiKey = trim($m[1], " '\"");

$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    echo "Modelli che supportano generateContent:\n";
    foreach ($data['models'] as $model) {
        if (in_array('generateContent', $model['supportedGenerationMethods'])) {
            echo "- " . $model['name'] . "\n";
        }
    }
} else {
    echo "Errore $httpCode: $response\n";
}
