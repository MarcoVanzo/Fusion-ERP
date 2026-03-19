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
$days = 28;
$token = $repo->getToken('USR_37ecc843');

if (empty($token['ig_account_id'])) {
    echo json_encode(['error' => 'ig_account_id is empty']);
    exit;
}

$since = date('Y-m-d', strtotime("-{$days} days"));
$until = date('Y-m-d');
$fields = 'follower_count,impressions,reach,profile_views';
$url = "https://graph.facebook.com/v21.0/{$token['ig_account_id']}/insights?" . http_build_query([
    'metric' => $fields,
    'period' => 'day',
    'since' => $since,
    'until' => $until,
    'access_token' => $token['access_token']
]);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);

echo json_encode(['raw_meta' => json_decode($res, true)]);
