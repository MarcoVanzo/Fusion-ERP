<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$apiKey = $_ENV['ECOMMERCE_COGNITO_API_KEY'] ?? '';
$formId = $_ENV['ECOMMERCE_FORM_ID'] ?? 17;

$url = "https://www.cognitoforms.com/api/odata/Forms({$formId})/Views(1)/Entries";
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey, 'Accept: application/json']
]);
$res = curl_exec($ch);
$data = json_decode($res, true);

if (!empty($data['value']) && isset($data['value'][0])) {
    $entry = $data['value'][0];
    echo json_encode($entry, JSON_PRETTY_PRINT);
} else {
    echo "No entries found in Cognito.";
}
