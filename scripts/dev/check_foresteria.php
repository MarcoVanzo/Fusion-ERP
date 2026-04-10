<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Modules\Societa\SocietaRepository;

try {
    $db = Database::getInstance();
    $tid = 'TNT_default'; 
    $repo = new SocietaRepository();
    
    echo "Checking info table...\n";
    $info = $repo->getForesteriaInfo($tid);
    print_r($info);
    
    echo "Checking expenses table...\n";
    $stmt = $db->prepare("SELECT count(*) FROM foresteria_expenses WHERE tenant_id = :tid");
    $stmt->execute([':tid' => $tid]);
    echo "Expenses count: " . $stmt->fetchColumn() . "\n";
    
    echo "Checking media table...\n";
    $stmt = $db->prepare("SELECT count(*) FROM foresteria_media WHERE tenant_id = :tid");
    $stmt->execute([':tid' => $tid]);
    echo "Media count: " . $stmt->fetchColumn() . "\n";
    
} catch (Exception $e) {
    echo "ERRORE: " . $e->getMessage() . "\n";
}
