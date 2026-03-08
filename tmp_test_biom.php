<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $repo = new \FusionERP\Modules\Biometrics\BiometricsRepository();
    
    // Get the first tenant
    $tenantId = $db->query("SELECT id FROM tenants LIMIT 1")->fetchColumn();
    
    echo "Using tenant_id: $tenantId\n";
    $metrics = $repo->getGroupMetrics($tenantId);
    
    echo "\n=== TEAM METRICS DATA ===\n";
    echo "Total Athletes: " . count($metrics['athletes']) . "\n";
    echo "Metric Types Count: " . count($metrics['metric_types']) . "\n";
    if (count($metrics['metric_types']) > 0) {
        echo "Keys: " . implode(", ", array_keys($metrics['metric_types'])) . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}