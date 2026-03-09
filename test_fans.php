<?php
require_once __DIR__ . "/api/Shared/Database.php";
$db = \FusionERP\Shared\Database::getInstance();
$tokenRow = $db->query("SELECT * FROM meta_tokens LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if (!$tokenRow)
    die("No token\n");

$pageId = $tokenRow['page_id'];
$accessToken = $tokenRow['access_token'];
$GRAPH_API_VERSION = 'v21.0';

$url = "https://graph.facebook.com/{$GRAPH_API_VERSION}/{$pageId}?fields=id,name,link,picture&access_token={$accessToken}";
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
echo "HTTP $httpCode\n";
echo $response . "\n";