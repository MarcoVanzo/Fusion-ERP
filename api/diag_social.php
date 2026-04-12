<?php
require __DIR__ . '/env_loader.php';
require __DIR__ . '/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Get latest logs
    $stmt = $db->query("SELECT * FROM meta_logs ORDER BY id DESC LIMIT 20");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get tokens (hide access token)
    $stmt2 = $db->query("SELECT user_id, page_id, ig_account_id, updated_at FROM meta_tokens ORDER BY updated_at DESC LIMIT 5");
    $tokens = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'logs' => $logs,
        'tokens' => $tokens
    ], JSON_PRETTY_PRINT);
} catch (\Exception $e) {
    echo $e->getMessage();
}
