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

        $url = "https://graph.facebook.com/v21.0/debug_token?input_token=$token&access_token=$token";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $res = curl_exec($ch);
        echo "Token Debug: $res\n";
    }
}
catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}