<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$apiKey = $_ENV['ECOMMERCE_COGNITO_API_KEY'] ?? '';
$formId = $_ENV['ECOMMERCE_FORM_ID'] ?? 17;

// Let's try expanding Order and/or LineItems
$url = "https://www.cognitoforms.com/api/odata/Forms({$formId})/Views(1)/Entries?\$top=1";
// Just check the raw document from Cognito again, sometimes lineItems are nested inside the original object but ignored by some view filters. Actually, let's query the specific Entry(1)
$url = "https://www.cognitoforms.com/api/odata/Forms({$formId})/Entries(1)";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey, 'Accept: application/json'],
    CURLOPT_SSL_VERIFYPEER => false
]);
$res = curl_exec($ch);
curl_close($ch);

$data = json_decode($res, true);
echo json_encode($data, JSON_PRETTY_PRINT);
