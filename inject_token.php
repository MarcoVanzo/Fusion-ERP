<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Content-Type: application/json; charset=UTF-8');

ini_set('display_errors', 1);
error_reporting(E_ALL);
require 'api/Shared/Database.php';
require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$appId = $_ENV['META_APP_ID'] ?? $_SERVER['META_APP_ID'] ?? getenv('META_APP_ID');
$appSecret = $_ENV['META_APP_SECRET'] ?? $_SERVER['META_APP_SECRET'] ?? getenv('META_APP_SECRET');

$shortLivedToken = 'EAAMs1yLIYqUBQ8Ap9yrbwTjbnAGQp7P2uTrzdgjPTA4ZAdsG9DfifqZC93wXZABNyNstbSw8mtwXp5JiYaBRD7ZBeuTtWaOLj5O7T9KNXH2qDcme7HsQtBkB8Ff2PU7MYCPSGqDrL5buKghR42i0N2306QM1Q2LK0Vl3i8DZAjZA90absNZCyf3foIy5W9DZAGIpZChRd5ge9TOnBp0DIHkL2X3TljJw8kkocHqyOww4yBkd6QodYO3IZAC9QZD';

// 1. Debug Token to see if it's correct
$debugUrl = "https://graph.facebook.com/debug_token?" . http_build_query([
    'input_token' => $shortLivedToken,
    'access_token' => "{$appId}|{$appSecret}"
]);

$ch = curl_init($debugUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$resDebug = curl_exec($ch);
curl_close($ch);

$debugData = json_decode($resDebug, true);
if (empty($debugData['data']['is_valid'])) {
    echo json_encode(['error' => 'Token fornito non valido!', 'debug' => $debugData]);
    exit;
}

// 2. Exchange for Long Lived Token
$exchangeUrl = "https://graph.facebook.com/v21.0/oauth/access_token?" . http_build_query([
    'grant_type' => 'fb_exchange_token',
    'client_id' => $appId,
    'client_secret' => $appSecret,
    'fb_exchange_token' => $shortLivedToken
]);

$ch = curl_init($exchangeUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$resEx = curl_exec($ch);
curl_close($ch);

$exchangeData = json_decode($resEx, true);
$longLivedToken = $exchangeData['access_token'] ?? $shortLivedToken;

// 3. Inject into Database
$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->prepare(
    'INSERT INTO meta_tokens (user_id, page_id, ig_account_id, page_name, ig_username, access_token, token_type, expires_at, created_at, updated_at) 
     VALUES (:user_id, :page_id, :ig_account_id, :page_name, :ig_username, :access_token, :token_type, :expires_at, NOW(), NOW())
     ON DUPLICATE KEY UPDATE 
        page_id=VALUES(page_id), ig_account_id=VALUES(ig_account_id), page_name=VALUES(page_name), ig_username=VALUES(ig_username), access_token=VALUES(access_token), token_type=VALUES(token_type), expires_at=VALUES(expires_at), updated_at=NOW()'
);

$expiresAt = date('Y-m-d H:i:s', time() + 5184000); // 60 days
$stmt->execute([
    ':user_id' => 'USR_37ecc843',
    ':page_id' => '618311941643826',
    ':ig_account_id' => '17841402397487720',
    ':page_name' => 'Fusion Team Volley',
    ':ig_username' => 'fusionteamvolley',
    ':access_token' => $longLivedToken,
    ':token_type' => 'long_lived',
    ':expires_at' => $expiresAt
]);

echo json_encode([
    'success' => true,
    'debug' => $debugData,
    'exchange' => $exchangeData,
    'token' => substr($longLivedToken, 0, 15) . '...'
]);
