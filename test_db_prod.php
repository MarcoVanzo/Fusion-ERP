<?php
require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

try {
    // Manually read .env or rely on the env if already set
    if (file_exists(__DIR__ . '/.env')) {
        $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            putenv($line);
            $parts = explode('=', $line, 2);
            if(count($parts)==2) {
                $_ENV[$parts[0]] = trim($parts[1], '"\' ');
            }
        }
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('SELECT tenant_id, COUNT(*) as c FROM societa_sponsors GROUP BY tenant_id');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Sponsors per tenant:\n";
    print_r($rows);
    
    // Also test a JSON encode 
    $stmt2 = $db->prepare("SELECT * FROM societa_sponsors WHERE is_deleted=0");
    $stmt2->execute();
    $res = $stmt2->fetchAll(PDO::FETCH_ASSOC);
    echo "\nJSON test (ALL):\n";
    $json = json_encode($res);
    if ($json === false) {
        echo "\nJSON error: " . json_last_error_msg();
    } else {
        echo "Valid JSON generated (Length: " . strlen($json) . ")\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
