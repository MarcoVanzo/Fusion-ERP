<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $db = new PDO(
        "mysql:host=" . getenv('DB_HOST') . ";dbname=" . getenv('DB_NAME'),
        getenv('DB_USER'),
        getenv('DB_PASS')
        );

    echo "<h1>Meta API Logs</h1>";
    $stmt = $db->query("SELECT * FROM meta_logs ORDER BY id DESC LIMIT 50");
    if ($stmt) {
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "<pre>" . print_r($rows, true) . "</pre>";
    }
    else {
        echo "<p>No logs table</p>";
    }

    $stmt = $db->query("SELECT * FROM meta_oauth_states ORDER BY created_at DESC LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<h1>Meta OAuth States (Production)</h1>";
    echo "<pre>" . print_r($rows, true) . "</pre>";

    echo "<h1>Meta Tokens</h1>";
    $stmt = $db->query("SELECT user_id, page_name, ig_username, ig_account_id, updated_at FROM meta_tokens ORDER BY updated_at DESC LIMIT 5");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "<pre>" . print_r($rows, true) . "</pre>";
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}