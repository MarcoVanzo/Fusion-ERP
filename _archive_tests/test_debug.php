<?php
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Cache-Control: post-check=0, pre-check=0', false);
header('Pragma: no-cache');
header('Content-Type: application/json; charset=UTF-8');

ini_set('display_errors', 1);
error_reporting(E_ALL);
require 'api/Shared/Database.php';
require 'api/Modules/Social/SocialRepository.php';
require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$repo = new \FusionERP\Modules\Social\SocialRepository();
$token = $repo->getToken('USR_37ecc843');
$appId = $_ENV['META_APP_ID'] ?? $_SERVER['META_APP_ID'] ?? getenv('META_APP_ID');
$appSecret = $_ENV['META_APP_SECRET'] ?? $_SERVER['META_APP_SECRET'] ?? getenv('META_APP_SECRET');

$url = "https://graph.facebook.com/debug_token?" . http_build_query([
    'input_token' => $token['access_token'],
    'access_token' => "{$appId}|{$appSecret}"
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);

echo $res;
