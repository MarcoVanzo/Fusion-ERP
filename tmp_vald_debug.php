<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdService;

$db = \FusionERP\Shared\Database::getInstance();
$tenantStmt = $db->query("SELECT DISTINCT tenant_id FROM athletes WHERE vald_athlete_id IS NOT NULL LIMIT 1");
$tId = $tenantStmt->fetchColumn() ?: 1;

TenantContext::setOverride((int)$tId);

$service = new ValdService();

$url = "https://prd-euw-api-extforcedecks.valdperformance.com/v2019q3/teams/TNT_default/tests/2024-01-01/2024-12-31/1";
echo "Requesting URL: $url\n\n";

// Get token
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

echo "Token fetch: " . ($token ? 'OK' : 'FAIL') . "\n";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer $token",
    "Accept: application/json"
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
