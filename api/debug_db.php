<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

$db = Database::getInstance();

header('Content-Type: application/json');

try {
    $tid = TenantContext::id();
    $athletes = $db->query("SELECT id, full_name, tenant_id, is_active, deleted_at FROM athletes LIMIT 10")->fetchAll();
    $counts = $db->query("SELECT tenant_id, COUNT(*) as cnt FROM athletes GROUP BY tenant_id")->fetchAll();
    
    echo json_encode([
        'current_tenant' => $tid,
        'athletes_sample' => $athletes,
        'tenant_distribution' => $counts,
        'env_tenant' => getenv('DEFAULT_TENANT_ID'),
        'server_tenant' => $_SERVER['DEFAULT_TENANT_ID'] ?? 'NOT_SET'
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
