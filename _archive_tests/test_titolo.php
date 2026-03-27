<?php
require "vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

require "api/Shared/Database.php";
require "api/Shared/TenantContext.php";
require "api/Modules/Societa/SocietaRepository.php";

$_SESSION['user'] = ['tenant_id' => 'TNT_default', 'role' => 'admin'];
\FusionERP\Shared\TenantContext::setOverride('TNT_default');

$repo = new \FusionERP\Modules\Societa\SocietaRepository();

try {
    $data = [
        ':id' => 'STT_test1234',
        ':tenant_id' => 'TNT_default',
        ':stagione' => '2025/2026',
        ':campionato' => 'provinciale',
        ':categoria' => 'Under 16',
        ':piazzamento' => 1,
        ':finali_nazionali' => 0,
        ':note' => null
    ];
    $repo->createTitolo($data);
    echo "SUCCESS";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
