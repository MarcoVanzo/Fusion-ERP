<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

use FusionERP\Modules\Auth\AuthController;
use FusionERP\Shared\Auth;
use FusionERP\Shared\Database;

try {
    $repo = new \FusionERP\Modules\Auth\AuthRepository();
    
    $id = 'USR_' . bin2hex(random_bytes(4));
    $hash = password_hash('TestPass123!', PASSWORD_BCRYPT, ['cost' => 12]);
    $email = 'test_' . time() . '@test.com';
    
    echo "Creating user...\n";
    $repo->createUser([
        'id' => $id,
        'email' => $email,
        'pwd_hash' => $hash,
        'role' => 'allenatore',
        'full_name' => 'Mario Rossi',
        'phone' => '+39 333 1234567',
        'permissions_json' => null
    ]);
    
    echo "Inserting password history...\n";
    $repo->insertPasswordHistory($id, $hash);
    
    echo "Done. No errors! Deleting test user...\n";
    
    $db = Database::getInstance();
    $db->prepare("DELETE FROM tenant_users WHERE user_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM password_history WHERE user_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
    
} catch (\Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
