<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/Response.php';


// Simulate request
$_GET['campionato_id'] = 'fed_3316c68e';
$_SERVER['REQUEST_METHOD'] = 'GET';

// Redefine Auth class dynamically for testing!
class AuthMock {
    public static function requireRead($module) {}
}

// Read the controller content
$content = file_get_contents(__DIR__ . '/api/Modules/Results/ResultsController.php');
// Remove the 'use FusionERP\Shared\Auth;'
$content = preg_replace('/use FusionERP\\\\Shared\\\\Auth;/', '', $content);
// We also need to strip <?php and namespace
$content = preg_replace('/<\?php/', '', $content);
$content = preg_replace('/namespace FusionERP\\\\Modules\\\\Results;/', '', $content);
// Write to a temporary file
file_put_contents('/tmp/ResultsControllerMock.php', "<?php\nnamespace FusionERP\\Modules\\Results;\nuse FusionERP\\Shared\\Database;\nuse FusionERP\\Shared\\Response;\nuse FusionERP\\Shared\\TenantContext;\nuse PDO;\nclass Auth {\npublic static function requireRead(\$module) {}\n}\n" . $content);


require_once '/tmp/ResultsControllerMock.php';

$controller = new FusionERP\Modules\Results\ResultsController();

// We must buffer Response::success which outputs JSON and exit
ob_start();
try {
    $controller->getResults();
} catch (Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
}
// since Response::success might exit, we use run_command and see its output.
