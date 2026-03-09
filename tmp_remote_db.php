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

    echo "--- META LOGS ---\n";
    $stmt = $db->query("SELECT * FROM meta_logs ORDER BY created_at DESC LIMIT 10");
    foreach ($stmt->fetchAll() as $row) {
        echo "[{$row['created_at']}] {$row['message']}\n";
    }

    echo "\n--- META TOKENS ---\n";
    $stmt = $db->query("SELECT user_id, page_id, ig_account_id, token_type, expires_at FROM meta_tokens");
    print_r($stmt->fetchAll());

}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}