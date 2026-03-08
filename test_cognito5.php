<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();
$apiKey = $_ENV['ECOMMERCE_COGNITO_API_KEY'] ?? '';
$formId = $_ENV['ECOMMERCE_FORM_ID'] ?? 17;
$url = "https://www.cognitoforms.com/api/odata/Forms({$formId})/Views(1)/Entries?\$top=2&\$expand=*";
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey, 'Accept: application/json'],
    CURLOPT_SSL_VERIFYPEER => false
]);
$res = curl_exec($ch);
file_put_contents('out5.json', $res);
