<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT access_token, page_id FROM meta_tokens WHERE user_id = 'USR_37ecc843'");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        $token = $row['access_token'];
        $pageId = $row['page_id'];

        echo "Page ID: $pageId\n";

        // Query 1: check ig account
        $url1 = "https://graph.facebook.com/v21.0/$pageId?fields=name,instagram_business_account&access_token=$token";
        $ch = curl_init($url1);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $res1 = curl_exec($ch);
        curl_close($ch);
        echo "Check IG Account: $res1\n\n";

        // Query 2: try new page metrics like page_impressions
        $url2 = "https://graph.facebook.com/v21.0/$pageId/insights?metric=page_impressions,page_post_engagements,page_fans&period=day&access_token=$token";
        $ch2 = curl_init($url2);
        curl_setopt($ch2, CURLOPT_RETURNTRANSFER, true);
        $res2 = curl_exec($ch2);
        curl_close($ch2);
        echo "Check Page Insights: $res2\n\n";
    }
    else {
        echo "No token found.\n";
    }
}
catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}