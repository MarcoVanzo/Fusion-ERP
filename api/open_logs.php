<?php
require __DIR__ . '/env_loader.php';
require __DIR__ . '/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT * FROM meta_logs ORDER BY id DESC LIMIT 50");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['logs' => $logs]);
} catch (\Exception $e) {
    echo $e->getMessage();
}
