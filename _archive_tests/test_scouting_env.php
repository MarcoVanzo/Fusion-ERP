<?php
require __DIR__ . '/../vendor/autoload.php';

require_once __DIR__ . '/Modules/Scouting/ScoutingController.php';

class TestScoutingController extends FusionERP\Modules\Scouting\ScoutingController {
    public static function testGetEnvVar($key) {
        $reflection = new ReflectionClass(self::class);
        $method = $reflection->getMethod('getEnvVar');
        $method->setAccessible(true);
        return $method->invoke(null, $key);
    }
}

echo "SCOUTING_FUSION_FORM_ID = " . var_export(TestScoutingController::testGetEnvVar('SCOUTING_FUSION_FORM_ID'), true) . "\n";
echo "SCOUTING_NETWORK_FORM_ID = " . var_export(TestScoutingController::testGetEnvVar('SCOUTING_NETWORK_FORM_ID'), true) . "\n";
