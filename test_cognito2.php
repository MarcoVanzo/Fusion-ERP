<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$apiKey = $_ENV['ECOMMERCE_COGNITO_API_KEY'] ?? '';
$formId = $_ENV['ECOMMERCE_FORM_ID'] ?? 17;

echo "ApiKey length: " . strlen($apiKey) . "\n";
echo "FormId: " . $formId . "\n";

$url = "https://www.cognitoforms.com/api/odata/Forms({$formId})/Views(1)/Entries?\$top=1";
echo "URL: " . $url . "\n";

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $apiKey, 'Accept: application/json'],
    CURLOPT_SSL_VERIFYPEER => false
]);
$res = curl_exec($ch);
if(curl_errno($ch)){
    echo 'Curl error: ' . curl_error($ch) . "\n";
}
curl_close($ch);

echo "Response length: " . strlen((string)$res) . "\n";
if (strlen((string)$res) > 0) {
    echo substr($res, 0, 500) . "\n";
}
