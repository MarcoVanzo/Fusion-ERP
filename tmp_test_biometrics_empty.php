<?php
require_once __DIR__ . '/api/config/database.php';
require_once __DIR__ . '/api/bootstrap.php';
require_once __DIR__ . '/api/Modules/Biometrics/BiometricsRepository.php';

use Modules\Biometrics\BiometricsRepository;

try {
    $db = Database::getConnection();
    $repo = new BiometricsRepository($db);

    // We mock the User for permissions Check
    $mockUser = (object)['role' => 'admin'];

    $metrics = $repo->getGroupMetrics();

    echo "=== TEAM METRICS DATA ===\n";
    echo "Total Athletes: " . count($metrics['athletes']) . "\n";
    echo "Metric Types Count: " . count($metrics['metric_types']) . "\n";
    echo "\nMetric Types Keys:\n";
    print_r(array_keys($metrics['metric_types']));

}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}