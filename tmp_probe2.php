<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

function testValdApiDate($dateFrom, $dateTo) {
    $url = "https://prd-euw-api-extforcedecks.valdperformance.com/v2019q3/teams/520b0e3c-60da-48c5-a756-3da0bc5dcfb1/tests/$dateFrom/$dateTo/1";
    echo "\nRequesting: $dateFrom -> $dateTo\n";

    $chToken = curl_init('https://auth.prd.vald.com/oauth/token');
    curl_setopt($chToken, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($chToken, CURLOPT_POST, true);
    curl_setopt($chToken, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => getenv('VALD_CLIENT_ID'),
        'client_secret' => getenv('VALD_CLIENT_SECRET'),
        'audience' => 'vald-api-external'
    ]));
    $tokenRes = curl_exec($chToken);
    $tokenData = json_decode($tokenRes, true);
    $token = $tokenData['access_token'] ?? '';
    curl_close($chToken);

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $token",
        "Accept: application/json"
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    echo "HTTP Code: $httpCode | Res: $response\n";
}

testValdApiDate('2026-01-01', '2026-02-01');
testValdApiDate('2026-02-01', '2026-03-01');
testValdApiDate('2026-02-01', '2026-03-12');
