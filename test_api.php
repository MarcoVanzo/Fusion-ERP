<?php
// Test API Staff endpoint on production
$loginUrl = 'https://www.fusionteamvolley.it/ERP/api/?module=auth&action=login';
$staffUrl = 'https://www.fusionteamvolley.it/ERP/api/?module=staff&action=list';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $loginUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'email' => 'marcol.vanzo87@gmail.com',
    'password' => 'xxx' // Use actual password here manually if needed or just use cookie
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, 'cookies.txt');
$loginRes = curl_exec($ch);

curl_setopt($ch, CURLOPT_URL, $staffUrl);
curl_setopt($ch, CURLOPT_POST, 0);
$staffRes = curl_exec($ch);
curl_close($ch);

echo "Login Response: " . substr($loginRes, 0, 100) . "\n";
echo "Staff Response: " . substr($staffRes, 0, 500) . "\n";