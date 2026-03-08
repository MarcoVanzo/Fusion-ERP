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
            return 'fusion';
        } // 'fusion' is probably the correct test tenant
    }
    class_alias('MockTenantContext', 'FusionERP\Shared\TenantContext');
}

require_once 'api/Shared/Database.php';
require_once 'api/Modules/Biometrics/BiometricsRepository.php';

try {
    $db = FusionERP\Shared\Database::getInstance();

    $repo = new FusionERP\Modules\Biometrics\BiometricsRepository($db);
    $res = $repo->getGroupMetrics('fusion'); // Fetch metrics for fusion tenant
    echo "Group Metrics OK: " . count($res['athletes']) . " athletes found\n";

}
catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}