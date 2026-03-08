<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

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

class MockTenantContext
{
    public static $current = '';
    public static function id()
    {
        return self::$current;
    }
}
if (!class_exists('FusionERP\Shared\TenantContext')) {
    class_alias('MockTenantContext', 'FusionERP\Shared\TenantContext');
}

require_once 'api/Shared/Database.php';
require_once 'api/Modules/Biometrics/BiometricsRepository.php';

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT DISTINCT tenant_id FROM athletes");
    $tenants = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tenants as $tenantId) {
        MockTenantContext::$current = $tenantId;
        try {
            $repo = new FusionERP\Modules\Biometrics\BiometricsRepository($db);
            $res = $repo->getGroupMetrics($tenantId);
            echo "Tenant [$tenantId]: OK - " . count($res['athletes']) . " athletes\n";
        }
        catch (Exception $e) {
            echo "Tenant [$tenantId]: ERROR - " . $e->getMessage() . "\n";
        }
    }
}
catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}