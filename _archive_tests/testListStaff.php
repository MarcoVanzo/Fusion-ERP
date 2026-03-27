<?php
$_ENV['APP_DEBUG'] = 'true';
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Modules/Staff/StaffRepository.php';

// Mock TenantContext by faking session or creating a mock DB.
// Actually, TenantContext uses session. Let's start a fake session.
session_start();
$_SESSION['user'] = ['tenant_id' => 'TNT_12345'];

$db = \FusionERP\Shared\Database::getInstance();
// insert a dummy tenant
$db->exec("INSERT IGNORE INTO tenants (id, name) VALUES ('TNT_12345', 'Test')");

try {
    $repo = new \FusionERP\Modules\Staff\StaffRepository();
    // Assuming tenant_id is set in TenantContext
    $list = $repo->listStaff();
    echo "SUCCESS! " . count($list) . " items returned.\n";
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
