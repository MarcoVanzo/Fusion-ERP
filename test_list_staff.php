<?php
putenv("APP_ENV=local");
require 'api/Shared/Database.php';
require 'api/Shared/TenantContext.php';
require 'api/Modules/Staff/StaffRepository.php';

use FusionERP\Shared\TenantContext;
use FusionERP\Modules\Staff\StaffRepository;

TenantContext::set('TENANT_1'); // Or whatever tenant is valid, like 'TENANT_DEFAULT'

$repo = new StaffRepository();
try {
    $data = $repo->listStaff();
    echo json_encode(["status" => "ok", "data" => $data], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
