<?php
require_once 'api/Shared/Database.php';
require_once 'api/Shared/TenantContext.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

// Mock environment or load .env
$env = file_get_contents('.env');
foreach (explode("\n", $env) as $line) {
    if (strpos(trim($line), '#') === 0 || !strpos($line, '=')) continue;
    putenv(trim($line));
    $_ENV[explode('=', $line)[0]] = trim(explode('=', $line, 2)[1], " \t\n\r\0\x0B'\"");
}

try {
    $db = Database::getInstance();
    $tid = $_ENV['DEFAULT_TENANT_ID'] ?? 'TNT_fusion';
    
    echo "Checking ec_products:\n";
    
    $stmt = $db->prepare("SELECT id, tenant_id, nome, prezzo FROM ec_products");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($results)) {
        echo "No products found in 'ec_products' table.\n";
    } else {
        echo "Found " . count($results) . " products:\n";
        print_r($results);
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
