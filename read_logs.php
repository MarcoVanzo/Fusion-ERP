<?php
require __DIR__ . '/api/env_loader.php';
require __DIR__ . '/api/Shared/Database.php';
$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT * FROM meta_logs ORDER BY id DESC LIMIT 20");
$logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach (array_reverse($logs) as $log) {
    echo $log['created_at'] . " - " . $log['message'] . "\n";
}
