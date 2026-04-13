<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Modules/Ecommerce/EcommerceController.php';

try {
    $db = FusionERP\Shared\Database::getInstance();
    
    // Check missing columns or schema differences
    $stmt = $db->query('DESCRIBE ec_orders');
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Columns: " . implode(", ", array_column($cols, 'Field')) . "\n";
    
    // Check how many we have right now
    $stmt = $db->query("SELECT tenant_id, count(*) as c FROM ec_orders GROUP BY tenant_id");
    echo "Orders in DB: " . json_encode($stmt->fetchAll(PDO::FETCH_ASSOC)) . "\n";

    echo "Finished test.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
