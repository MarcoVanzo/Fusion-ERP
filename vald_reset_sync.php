<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: text/plain');

try {
    require_once __DIR__ . '/vendor/autoload.php';
    echo "autoload OK\n";

    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
    $dotenv->safeLoad();
    echo "dotenv OK\n";

    use FusionERP\Shared\Database;
    $db = Database::getInstance();
    echo "DB OK\n";

    use FusionERP\Shared\TenantContext;
    $row = $db->query('SELECT id FROM tenants LIMIT 1')->fetch(PDO::FETCH_ASSOC);
    echo "Tenant row: " . json_encode($row) . "\n";
    TenantContext::setOverride($row['id'] ?? 'TNT_default');
    echo "TenantContext OK\n";

    use FusionERP\Modules\Vald\ValdService;
    echo "ValdService class loaded OK\n";

    $svc = new ValdService();
    echo "ValdService instantiated OK\n";

} catch (\Throwable $e) {
    echo "ERRORE: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    echo $e->getTraceAsString() . "\n";
}
