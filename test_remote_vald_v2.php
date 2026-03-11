<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/api/vendor/autoload.php';
require_once __DIR__ . '/api/Modules/Vald/ValdService.php';

use FusionERP\Modules\Vald\ValdService;

echo "Starting test...\n";

try {
    $service = new ValdService();
    echo "Service initialized.\n";
    $profiles = $service->getProfiles();
    echo "Profiles: \n";
    print_r($profiles);
    
    $results = $service->getTestResults();
    echo "\nResults: \n";
    print_r($results);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
} catch (\Throwable $t) {
    echo "Throwable: " . $t->getMessage();
}
echo "\nDone.";
