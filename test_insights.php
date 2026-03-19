<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);
require_once 'api/Shared/Database.php';
require_once 'api/Modules/Social/SocialRepository.php';
require_once 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$repo = new \FusionERP\Modules\Social\SocialRepository();
$days = 28;
$token = $repo->getToken('USR_37ecc843'); // Live prod DB should return their token!

if (!$token || !$repo->isTokenValid($token)) {
    echo json_encode(['error' => 'No token', 'mock' => $repo->getMockData($days)]);
    exit;
}

try {
    $profile = [];
    $igInsights = [];
    $posts = [];
    $fbInsights = [];

    if (!empty($token['ig_account_id'])) {
        $profile = $repo->getIgProfile($token['ig_account_id'], $token['access_token']);
        $igInsights = $repo->getIgInsights($token['ig_account_id'], $token['access_token'], 'day', $days);
        $posts = $repo->getIgMedia($token['ig_account_id'], $token['access_token'], 12);
    }

    if (!empty($token['page_id'])) {
        $fbInsights = $repo->getFbPageInsights($token['page_id'], $token['access_token'], $days);
    }

    echo json_encode([
        'profile' => [
            'id' => $token['ig_account_id'] ?? null,
            'username' => $token['ig_username'] ?? '',
            'name' => $token['ig_username'] ?? '',
            'followers_count' => $profile['followers_count'] ?? 0,
            'media_count' => $profile['media_count'] ?? 0,
        ],
        'fb_insights' => $fbInsights,
        'fb_page_name' => $token['page_name'] ?? 'Facebook Page',
        'is_mock' => false,
    ]);
} catch (\Throwable $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
