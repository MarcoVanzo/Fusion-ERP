<?php
require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/shared/Database.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

try {
    // Quick mock for TenantContext if it requires session or headers
    // Actually we'll just query without tenant context if we can.
    $pdo = Database::getInstance();
    $stmt = $pdo->query("SELECT id, label, url FROM federation_championships WHERE is_active = 1 LIMIT 5");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($rows);
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}