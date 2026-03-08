<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "Start\n";

require_once __DIR__ . '/vendor/autoload.php';
echo "Autoload ok\n";

try {
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
    $dotenv->load();
    echo "Dotenv ok\n";
} catch (Throwable $e) {
    echo "Dotenv Error: " . $e->getMessage() . "\n";
}

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    echo "DB ok\n";
    $stmt = $db->query("SELECT tenant_id, COUNT(*) AS count FROM athletes WHERE deleted_at IS NULL GROUP BY tenant_id");
    
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $rows]);
} catch (Throwable $e) {
    echo "DB Error: " . $e->getMessage() . "\n";
}