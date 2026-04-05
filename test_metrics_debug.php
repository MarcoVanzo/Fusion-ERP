<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

// Mocking some superglobals that might be used
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['HTTP_HOST'] = 'localhost';

// Load .env
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Auth.php';
require_once __DIR__ . '/api/Modules/Vald/ValdRepository.php';
require_once __DIR__ . '/api/Modules/Vald/ValdService.php';

use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Vald\ValdRepository;
use FusionERP\Modules\Vald\ValdService;

// Manually set tenant for debugging
TenantContext::setOverride('TNT_fusion');

$repo = new ValdRepository();
$service = new ValdService($repo);

$athleteId = 'ATH_eeb5e1aa';
$latest = $repo->getLatestResult($athleteId);

if (!$latest) {
    echo "Nessun dato trovato per l'atleta $athleteId\n";
    // List all athletes with vald data for this tenant
    $db = \FusionERP\Shared\Database::getInstance();
    $stmt = $db->prepare('SELECT DISTINCT athlete_id FROM vald_test_results WHERE tenant_id = :tid');
    $stmt->execute([':tid' => 'TNT_fusion']);
    $ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Atleti con dati VALD: " . implode(', ', $ids) . "\n";
    exit;
}

echo "Ultimo test: " . $latest['test_date'] . " (" . $latest['test_type'] . ")\n";
$metrics = json_decode($latest['metrics'], true);
echo "Metrics JSON: " . json_encode($metrics, JSON_PRETTY_PRINT) . "\n";

$deep = $service->getDeepAnalytics($athleteId);
echo "Deep Analytics Result: " . json_encode($deep, JSON_PRETTY_PRINT) . "\n";

// Check specifically for Peak Power
echo "Peak Power BM (from deep): " . ($deep['Concentric Peak Power / BM (W/kg)'] ?? 'N/A') . "\n";
echo "ConcentricPeakPower (from metrics): " . ($metrics['ConcentricPeakPower']['Value'] ?? 'N/A') . "\n";
