<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return;
    throw new \ErrorException($message, 0, $severity, $file, $line);
});
set_exception_handler(function(\Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
});

use FusionERP\Modules\Auth\AuthRepository;
$repo = new AuthRepository();

try {
    echo "Testing listUsers...\n";
    $users = $repo->listUsers();
    echo "listUsers OK. Count: " . count($users) . "\n";

    echo "Testing createUser...\n";
    $id = 'USR_TEST_' . bin2hex(random_bytes(2));
    $repo->createUser([
        'id' => $id,
        'email' => 'test_' . time() . '@example.com',
        'pwd_hash' => password_hash('password123', PASSWORD_BCRYPT),
        'role' => 'atleta',
        'full_name' => 'Test Invitato',
        'phone' => null,
        'permissions_json' => []
    ]);
    echo "createUser OK.\n";
    
    // Testing updateLastLogin
    echo "Testing updateLastLogin...\n";
    $repo->updateLastLogin($id);
    echo "updateLastLogin OK.\n";
    
    // Cleanup
    $db = \FusionERP\Shared\Database::getInstance();
    $db->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
    $db->prepare("DELETE FROM tenant_users WHERE user_id = ?")->execute([$id]);
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
