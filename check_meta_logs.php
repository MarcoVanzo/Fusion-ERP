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

    echo "<h1>Meta API Logs - FORCED NO CACHE</h1>";
    $stmt = $db->query("SELECT * FROM meta_logs ORDER BY id DESC LIMIT 50");
    if ($stmt) {
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "<pre>" . print_r($rows, true) . "</pre>";
    }
    else {
        echo "<p>No logs table</p>";
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}