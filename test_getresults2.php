<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/Response.php';
require_once __DIR__ . '/api/Shared/Auth.php';

// Simulate request
$_GET['campionato_id'] = 'fed_3316c68e';
$_SERVER['REQUEST_METHOD'] = 'GET';

// Read the controller content
$content = file_get_contents(__DIR__ . '/api/Modules/Results/ResultsController.php');
// Remove Auth::requireRead
$content = preg_replace('/Auth::requireRead\(\'results\'\);/', '', $content);
// Use a temp class name so we don't conflict, wait we can just save it and require it
file_put_contents('/tmp/ResultsControllerMock2.php', $content);

require_once '/tmp/ResultsControllerMock2.php';

$controller = new FusionERP\Modules\Results\ResultsController();
try {
    $controller->getResults();
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
