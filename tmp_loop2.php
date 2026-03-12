<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdService;

$db = \FusionERP\Shared\Database::getInstance();
$tenantStmt = $db->query("SELECT DISTINCT tenant_id FROM athletes WHERE vald_athlete_id IS NOT NULL LIMIT 1");
$tId = $tenantStmt->fetchColumn() ?: 1;

TenantContext::setOverride((int)$tId);

$service = new ValdService();
$results = [];
$startStamp = strtotime('2023-01-01');
$endStamp = time();
$chunkSeconds = 90 * 86400; // 90 days (~3 months)

echo "Starting loop...\n";

for ($t = $startStamp; $t < $endStamp; $t += $chunkSeconds) {
    $dateFrom = date('Y-m-d', $t);
    $tNext = $t + $chunkSeconds - 1;
    $dateTo = date('Y-m-d', min($tNext, $endStamp));
    
    echo "Chunk: $dateFrom -> $dateTo\n";
    $page = 1;

    while (true) {
        $pageResults = $service->getTestResults($dateFrom, '', $page, $dateTo);
        
        if (empty($pageResults) || !is_array($pageResults) || isset($pageResults['error'])) {
            echo "  Page $page empty or error. Breaking.\n";
            break;
        }
        $count = count($pageResults);
        echo "  Page $page found $count items.\n";
        $results = array_merge($results, $pageResults);
        
        if ($count < 100) {
            echo "  Page $page count < 100, breaking pagination.\n";
            break;
        }
        $page++;
        if ($page > 50) break; 
    }
}

echo "\nTotal Results: " . count($results) . "\n";
