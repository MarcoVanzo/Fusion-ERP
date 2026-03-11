<?php
require_once __DIR__ . '/api/vendor/autoload.php';

use FusionERP\Modules\Vald\ValdService;

$service = new ValdService();
try {
    $profiles = $service->getProfiles();
    echo "Profiles: \n";
    print_r($profiles);
    
    $results = $service->getTestResults();
    echo "\nResults: \n";
    print_r($results);
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
