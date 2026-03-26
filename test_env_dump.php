<?php
$envFile = __DIR__ . '/.env';
echo "Path derived from router: " . __DIR__ . "\n";
echo "Resolved envFile: " . $envFile . "\n";
echo "file_exists? " . (file_exists($envFile) ? "YES" : "NO") . "\n";

if (file_exists($envFile)) {
    echo "Is readable? " . (is_readable($envFile) ? "YES" : "NO") . "\n";
    $content = file_get_contents($envFile);
    echo "Contains SCOUTING_FUSION_FORM_ID? " . (strpos($content, 'SCOUTING_FUSION_FORM_ID') !== false ? "YES" : "NO") . "\n";
}

echo "\n--- Dotenv test ---\n";
require __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$envVars = $dotenv->safeLoad();
echo "Dotenv loaded SCOUTING_FUSION_FORM_ID? " . (isset($envVars['SCOUTING_FUSION_FORM_ID']) ? "YES: " . $envVars['SCOUTING_FUSION_FORM_ID'] : "NO") . "\n";
echo "EnvVal in _ENV? : " . ($_ENV['SCOUTING_FUSION_FORM_ID'] ?? "NO") . "\n";

echo "\n--- ScoutingController test ---\n";
require_once __DIR__ . '/api/Modules/Scouting/ScoutingController.php';

class TestScoutingController extends FusionERP\Modules\Scouting\ScoutingController {
    public static function testGetEnvVar($key) {
        $reflection = new ReflectionClass(self::class);
        $method = $reflection->getMethod('getEnvVar');
        $method->setAccessible(true);
        return $method->invoke(null, $key);
    }
}
echo "ScoutingController parsed FUSION_FORM_ID: " . var_export(TestScoutingController::testGetEnvVar('SCOUTING_FUSION_FORM_ID'), true) . "\n";
