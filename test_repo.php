<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

// Mock Auth and TenantContext before anything else
class TenantContext {
    public static function id() { return 'TNT_default'; }
}
class Auth {
    public static function user() { return ['role' => 'manager']; }
    public static function requireRole($role) {}
}

if (!class_exists('FusionERP\Shared\TenantContext')) {
    class_alias('TenantContext', 'FusionERP\Shared\TenantContext');
}
if (!class_exists('FusionERP\Shared\Auth')) {
    class_alias('Auth', 'FusionERP\Shared\Auth');
}

require_once __DIR__ . '/api/shared/Database.php';
require_once __DIR__ . '/api/Modules/Staff/StaffRepository.php';

use FusionERP\Shared\Database;
use FusionERP\Modules\Staff\StaffRepository;

$db = Database::getInstance();
$repo = new StaffRepository($db);

$staffId = '0349a4dcb53e3cb547e4'; // Use a known ID
try {
    $repo->update($staffId, [
        ':first_name' => 'Mario',
        ':last_name' => 'Rossi',
        ':role' => null,
        ':birth_date' => null,
        ':birth_place' => null,
        ':residence_address' => null,
        ':residence_city' => null,
        ':phone' => null,
        ':email' => null,
        ':fiscal_code' => null,
        ':identity_document' => null,
        ':medical_cert_expires_at' => null,
        ':notes' => null
    ], ['TEAM_u14a', 'TEAM_u16a']);
    echo "Update executed successfully.\n";

    $staff = $repo->getById($staffId);
    echo "Saved team IDs: " . json_encode($staff['team_ids']) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}