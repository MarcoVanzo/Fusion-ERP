<?php
// Test API Staff creation endpoint on production
$loginUrl = 'https://www.fusionteamvolley.it/ERP/api/?module=auth&action=login';
$staffUpdateUrl = 'https://www.fusionteamvolley.it/ERP/api/?module=staff&action=update';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $loginUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'email' => 'marcol.vanzo87@gmail.com',
    'password' => 'fusion1' // We will replace with real password or token manually if needed
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_COOKIEJAR, 'mycookie2.txt');
$loginRes = curl_exec($ch);

// Use a known staff member ID (we get it from staff.js list or assume one exists)
$staffData = [
    'id' => 'STF_1f4c7d0d', // Placeholder
    'first_name' => 'API Test',
    'last_name' => 'Member',
    'team_ids' => ['1', '2']
];

curl_setopt($ch, CURLOPT_URL, $staffUpdateUrl);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($staffData));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
$staffRes = curl_exec($ch);
curl_close($ch);

echo "Update Response: " . $staffRes . "\n";