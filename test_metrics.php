<?php
require_once __DIR__ . "/api/Shared/Database.php";
$db = \FusionERP\Shared\Database::getInstance();
$tokenRow = $db->query("SELECT * FROM meta_tokens LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if (!$tokenRow) die("No token\n");

$metrics = ['page_views_total', 'page_engaged_users', 'page_post_engagements', 'page_fans'];
$pageId = $tokenRow['page_id'];
$accessToken = $tokenRow['access_token'];
$GRAPH_API_VERSION = 'v21.0';

foreach ($metrics as $metric) {
    if ($metric == 'page_fans') {
        $period = 'lifetime';
    } else {
        $period = 'day';
    }
    $url = "https://graph.facebook.com/{$GRAPH_API_VERSION}/{$pageId}/insights?metric={$metric}&period={$period}&access_token={$accessToken}";
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    echo "$metric ($period): HTTP $httpCode\n";
    echo $response . "\n\n";
}
