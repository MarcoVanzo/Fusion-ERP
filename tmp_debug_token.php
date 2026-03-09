<?php
try {
    $db = new PDO(
        "mysql:host=31.11.39.161;port=3306;dbname=Sql1804377_2;charset=utf8mb4",
        "Sql1804377",
        'u3z4t994$@psAPr',
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]
        );

    $stmt = $db->query("SELECT access_token, page_id FROM meta_tokens WHERE user_id = 'USR_37ecc843'");
    $row = $stmt->fetch();

    if ($row) {
        $token = $row['access_token'];
        $url = "https://graph.facebook.com/v21.0/debug_token?input_token=$token&access_token=$token";
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $res = curl_exec($ch);
        echo "Token Debug: $res\n";
    }
    else {
        echo "No token found.\n";
    }

}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}