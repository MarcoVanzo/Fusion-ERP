<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

// We need to define Auth to pass the requireRead check
class MockAuth
{
    public static function requireRead($module)
    {
        return true;
    }
    public static function requireWrite($module)
    {
        return true;
    }
    public static function user()
    {
        return ['id' => 'USR_TEST', 'role' => 'admin'];
    }
}
if (!class_exists('FusionERP\Shared\Auth')) {
    class_alias('MockAuth', 'FusionERP\Shared\Auth');
}

// Ensure TenantContext exists
if (!class_exists('FusionERP\Shared\TenantContext')) {
    class MockTenantContext
    {
        public static function id()
        {
            return 'fipav_test_tenant';
        }
    }
    class_alias('MockTenantContext', 'FusionERP\Shared\TenantContext');
}

require_once 'api/Shared/Database.php';
require_once 'api/Modules/Athletes/AthletesRepository.php';
require_once 'api/Modules/Vald/ValdRepository.php';

try {
    $db = FusionERP\Shared\Database::getInstance();

    // Pick an athlete ID that actually has some data
    $stmt = $db->query("SELECT id FROM athletes LIMIT 1");
    $athleteId = $stmt->fetchColumn();

    echo "Athlete ID: $athleteId\n";

    $repo = new FusionERP\Modules\Athletes\AthletesRepository($db);
    $res = $repo->getMetricsHistory($athleteId, 30);
    echo "Metrics History OK: " . count($res) . " records\n";

    // Now try VALD directly
    $valdRepo = new FusionERP\Modules\Vald\ValdRepository($db);
    $valdAnalytics = $valdRepo->getAthleteAnalytics($athleteId);
    echo "Vald Analytics OK\n";

}
catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}