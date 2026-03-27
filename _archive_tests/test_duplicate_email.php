<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Modules\Auth\AuthRepository;

$repo = new AuthRepository();

// Genera dati fittizi
$id = 'USR_' . bin2hex(random_bytes(4));
$email = 'soft_delete_test_' . time() . '@test.com';

try {
    echo "1. Creating test a user...\n";
    $repo->createUser([
        'id' => $id,
        'email' => $email,
        'pwd_hash' => 'hash123',
        'role' => 'allenatore',
        'full_name' => 'Soft Delete Test',
        'phone' => '123'
    ]);

    echo "2. Soft-deleting the user...\n";
    $repo->deactivateUser($id);

    echo "3. Checking if it's in the trash (should be true)...\n";
    $inTrash = $repo->emailExistsInTrash($email);
    echo "Result: " . ($inTrash ? "TRUE" : "FALSE") . "\n";

    echo "4. Checking if it exists normally (should be null)...\n";
    $normal = $repo->getUserByEmail($email);
    echo "Result: " . ($normal === null ? "NULL" : "EXISTS") . "\n";
    
    echo "5. Cleaning up...\n";
    $db = Database::getInstance();
    $db->prepare("DELETE FROM tenant_users WHERE user_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
    
} catch (\Throwable $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
    $db = Database::getInstance();
    $db->prepare("DELETE FROM tenant_users WHERE user_id = ?")->execute([$id]);
    $db->prepare("DELETE FROM users WHERE id = ?")->execute([$id]);
}
