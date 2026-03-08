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
    $dbConfig = [
        'host' => '31.11.39.161',
        'dbname' => 'Sql1804377_2',
        'user' => 'Sql1804377',
        'pass' => 'u3z4t994$@psAPr',
        'port' => '3306'
    ];

    $dsn = "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['dbname']};charset=utf8mb4";
    $db = new PDO($dsn, $dbConfig['user'], $dbConfig['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    // We need to pass a mock object that acts like the Database class wrapper if BiometricsRepository expects it.
    // Looking at BiometricsRepository constructor: `public function __construct(PDO $db = null)`
    // Wait, let's check BiometricsRepository constructor first.
    // It's probably `public function __construct(Database $db)` or similar.
    // Let's check api/Shared/Database.php to see if it extends PDO or wraps it.

    // Actually, I'll just use reflection to force the PDO instance into FusionERP\Shared\Database.
    $dbInstance = FusionERP\Shared\Database::getInstance();
    $reflection = new ReflectionClass(FusionERP\Shared\Database::class);
    $prop = $reflection->getProperty('pdo');
    $prop->setAccessible(true);
    $prop->setValue($dbInstance, $db);

    $stmt = $dbInstance->query("SELECT DISTINCT tenant_id FROM athletes");
    $tenants = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "Found " . count($tenants) . " tenants in production.\n";

    foreach ($tenants as $tenantId) {
        MockTenantContext::$current = $tenantId;
        try {
            $repo = new FusionERP\Modules\Biometrics\BiometricsRepository($dbInstance);
            $res = $repo->getGroupMetrics($tenantId);
            echo "Tenant [$tenantId]: OK - " . count($res['athletes']) . " athletes\n";
        }
        catch (Exception $e) {
            echo "Tenant [$tenantId]: ERROR - " . $e->getMessage() . "\n";
        }
    }
}
catch (Exception $e) {
    echo "GENERAL ERROR: " . $e->getMessage() . "\n";
}