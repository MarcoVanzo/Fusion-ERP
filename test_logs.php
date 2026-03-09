<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
require_once __DIR__ . '/api/Shared/Database.php';
try {
    $db = \FusionERP\Shared\Database::getInstance();
    $db->exec("CREATE TABLE IF NOT EXISTS meta_logs (id INT AUTO_INCREMENT PRIMARY KEY, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
    $logs = $db->query("SELECT * FROM meta_logs ORDER BY created_at DESC LIMIT 20")->fetchAll(PDO::FETCH_ASSOC);
    print_r($logs);
} catch (Exception $e) {
    echo $e->getMessage();
}
