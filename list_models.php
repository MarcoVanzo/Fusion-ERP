<?php
declare(strict_types=1);

// Carica il token dal file .env
$env = file_get_contents(__DIR__ . '/.env');
preg_match('/GEMINI_TOKEN=(.*)/', $env, $m);
$apiKey = trim($m[1], " '\"");

if (!$apiKey) {
    die("API Key non trovata nel file .env\n");
}

$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $apiKey;

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    echo "Errore cURL: " . curl_error($ch) . "\n";
} else {
    echo "HTTP Code: $httpCode\n";
    $data = json_decode($response, true);
    if ($httpCode === 200 && isset($data['models'])) {
        echo "Modelli disponibili:\n";
        foreach ($data['models'] as $model) {
            echo "- " . $model['name'] . " (" . implode(', ', $model['supportedGenerationMethods']) . ")\n";
        }
    } else {
        echo "Errore nella risposta:\n";
        print_r($data);
    }
}
curl_close($ch);
