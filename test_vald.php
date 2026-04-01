<?php
$_SERVER['DOCUMENT_ROOT'] = __DIR__;
require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Modules/Vald/ValdRepository.php';
require_once __DIR__ . '/api/Modules/Vald/ValdService.php';
require_once __DIR__ . '/api/Shared/Auth.php';

use FusionERP\Shared\TenantContext;

// Mock the settings override so we don't have to call init() properly if it's complex
TenantContext::setOverride(1);

$repo = new \FusionERP\Modules\Vald\ValdRepository();
$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT athlete_id FROM vald_test_results LIMIT 1");
$athleteId = $stmt->fetchColumn();

if (!$athleteId) {
    echo "No vald tests found";
    exit;
}

echo "Testing for athlete: $athleteId\n";

$_GET['athleteId'] = $athleteId;
require_once __DIR__ . '/api/Modules/Vald/ValdController.php';

$controller = new \FusionERP\Modules\Vald\ValdController();
try {
    $service = new \FusionERP\Modules\Vald\ValdService($repo);
    $latest = $repo->getLatestResult($athleteId);
    $metrics = json_decode($latest['metrics'] ?? '{}', true) ?: [];
    $baseline = $repo->getBaselineMetrics($athleteId);
    $semaphore = $service->computeSemaphore($metrics, $baseline);
    $asymmetry = $service->computeAsymmetry($metrics);
    $muscleMap = $service->computeMuscleMap($semaphore, $asymmetry);
    
    echo json_encode(compact('semaphore', 'asymmetry', 'muscleMap'));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
