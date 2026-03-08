<?php
// fake $_SERVER to let bootstrap run
$_SERVER['DOCUMENT_ROOT'] = __DIR__;
$_SERVER['HTTP_HOST'] = 'localhost';

require_once __DIR__ . '/api/bootstrap.php';
require_once __DIR__ . '/api/Modules/Biometrics/BiometricsRepository.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $repo = new \FusionERP\Modules\Biometrics\BiometricsRepository();

    // We need a tenant context. By looking at Bootstrap or how Auth works:
    // Actually, getGroupMetrics needs $tenantId and optional $teamId.
    // Let's get the first tenant
    $tenantId = $db->query("SELECT id FROM tenants LIMIT 1")->fetchColumn();

    echo "Using tenant_id: $tenantId\n";
    $metrics = $repo->getGroupMetrics($tenantId);

    echo "\n=== TEAM METRICS DATA ===\n";
    echo "Total Athletes: " . count($metrics['athletes']) . "\n";
    echo "Metric Types Count: " . count($metrics['metric_types']) . "\n";
    if (count($metrics['metric_types']) > 0) {
        echo "Keys: " . implode(", ", array_keys($metrics['metric_types'])) . "\n";
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}