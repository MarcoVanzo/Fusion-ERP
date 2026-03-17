<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

$db = FusionERP\Shared\Database::getInstance();
$stmt = $db->query('SELECT id, tenant_id FROM network_collaborations LIMIT 1');
$collab = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$collab) {
    echo "Inserting dummy collaboration...\n";
    $stmt = $db->prepare('INSERT INTO network_collaborations (id, tenant_id, partner_name, partner_type, status) VALUES (:id, :tid, :pname, :ptype, :status)');
    $stmt->execute([
        ':id' => 'TEST_COL',
        ':tid' => '1',
        ':pname' => 'Dummy Collab',
        ':ptype' => 'altro',
        ':status' => 'attivo'
    ]);
    $collabId = 'TEST_COL';
    $tenantId = '1';
} else {
    $collabId = $collab['id'];
    $tenantId = $collab['tenant_id'];
}

echo "Using Collab ID $collabId (Tenant $tenantId)\n";

$dummyFile = __DIR__ . '/dummy_logo.png';
$img = imagecreatetruecolor(10, 10);
imagepng($img, $dummyFile);
// imagedestroy($img); // deprecated

// Hack Auth
$userMock = [
    'id' => '1',
    'tenant_id' => $tenantId,
    'role' => 'manager',
    'permissions' => []
];

// We bypass the HTTP request to call the controller directly to see exactly where it fails
require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Response.php';
require_once __DIR__ . '/api/Modules/Network/NetworkController.php';

echo "Setting Tenant Context...\n";
FusionERP\Shared\TenantContext::setOverride($tenantId);

echo "Mocking Auth session...\n";
session_start();
$_SESSION['user_id'] = '1';
$_SESSION['user'] = $userMock;
$_SESSION['tenant_id'] = $tenantId;

echo "Setting up POST and FILES globals...\n";
$_POST['collaboration_id'] = $collabId;

$_FILES['logo'] = [
    'name' => 'dummy_logo.png',
    'type' => 'image/png',
    'tmp_name' => $dummyFile,
    'error' => UPLOAD_ERR_OK,
    'size' => filesize($dummyFile)
];

echo "Calling controller...\n";

// We wrap Response::success and Response::error to not exit so we can see what happens
try {
    $controller = new \FusionERP\Modules\Network\NetworkController();
    $controller->uploadColLogo();
    echo "Controller finished without throwing.\n";
} catch (\Exception $e) {
    echo "CAUGHT EXCEPTION: " . $e->getMessage() . "\n";
} catch (\Error $e) {
    echo "CAUGHT FATAL ERROR: " . $e->getMessage() . "\n";
}
