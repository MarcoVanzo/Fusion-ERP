<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Modules/Staff/StaffRepository.php';

use FusionERP\Modules\Staff\StaffRepository;

class MockTenantContext {
    public static function id() {
        return 'test-tenant'; // fallback if necessary, or just catch the PDO Exception
    }
}

try {
    $repo = new StaffRepository();
    $res = $repo->listStaff();
    echo "Success! " . count($res) . " rows returned.\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
