<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/Response.php';

// Simulate request
$_POST['id'] = 'fed_3316c68e'; // U16
$_SERVER['REQUEST_METHOD'] = 'POST';

// Read the controller content
$content = file_get_contents(__DIR__ . '/api/Modules/Results/ResultsController.php');
// Remove Auth wrapper
$content = preg_replace('/Auth::requireWrite\(\'results\'\);/', '', $content);
file_put_contents('/tmp/ResultsControllerMock4.php', $content);

require_once '/tmp/ResultsControllerMock4.php';

$controller = new FusionERP\Modules\Results\ResultsController();
try {
    $controller->sync();
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . " at " . $e->getFile() . ":" . $e->getLine();
}
