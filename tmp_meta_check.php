<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT * FROM meta_logs ORDER BY created_at DESC LIMIT 20");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r("--- META LOGS ---\n");
    print_r($logs);

    $stmt = $db->query("SELECT * FROM meta_oauth_states ORDER BY created_at DESC LIMIT 5");
    $states = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r("\n--- OAUTH STATES ---\n");
    print_r($states);
    
    $stmt = $db->query("SELECT user_id, page_id, ig_account_id, token_type, expires_at FROM meta_tokens");
    $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r("\n--- TOKENS ---\n");
    print_r($tokens);
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}