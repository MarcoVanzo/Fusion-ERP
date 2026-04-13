<?php
require_once 'api/Shared/Database.php';
require_once 'api/Shared/TenantContext.php';

use FusionERP\Shared\Database;

// Try to load env for db credentials if local, otherwise assume on server
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    $env = file_get_contents($envPath);
    foreach (explode("\n", $env) as $line) {
        if (strpos(trim($line), '#') === 0 || !strpos($line, '=')) continue;
        putenv(trim($line));
        $_ENV[explode('=', $line)[0]] = trim(explode('=', $line, 2)[1], " \t\n\r\0\x0B'\"");
    }
}

try {
    $db = Database::getInstance();
    
    // Fix products
    $stmt = $db->prepare("UPDATE ec_products SET tenant_id = 'TNT_fusion' WHERE tenant_id = 'TNT_default' OR tenant_id = ''");
    $stmt->execute();
    echo "Fixed " . $stmt->rowCount() . " products.\n";

    // Fix orders
    $stmt = $db->prepare("UPDATE ec_orders SET tenant_id = 'TNT_fusion' WHERE tenant_id = '' OR tenant_id IS NULL");
    $stmt->execute();
    echo "Fixed " . $stmt->rowCount() . " orders.\n";

    // Dump tenants
    echo "\nTENANTS:\n";
    $stmt = $db->prepare("SELECT id, name FROM tenants");
    $stmt->execute();
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    echo "\nEC_PRODUCTS:\n";
    $stmt = $db->prepare("SELECT id, tenant_id, nome, prezzo FROM ec_products");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if(empty($products)) {
        echo "No products found!\n";
    } else {
        print_r($products);
    }
    
    // EC_ORDERS
    echo "\nEC_ORDERS (Counts per tenant):\n";
    $stmt = $db->prepare("SELECT tenant_id, count(*) as c FROM ec_orders GROUP BY tenant_id");
    $stmt->execute();
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
