<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    echo "1. DB Connection...\n";
    $db = FusionERP\Shared\Database::getInstance();
    
    echo "2. Testing updateColLogo query...\n";
    $collabId = 'TEST_ID';
    $logoPath = 'test/path/logo.png';
    $tenantId = '1';
    
    $stmt = $db->prepare('UPDATE network_collaborations SET logo_path = :lp WHERE id = :id AND tenant_id = :tid');
    $stmt->execute([':lp' => $logoPath, ':id' => $collabId, ':tid' => $tenantId]);
    echo "3. Query executed successfully.\n";

    echo "4. Checking upload limit: " . ini_get('upload_max_filesize') . "\n";
    echo "5. Checking post limit: " . ini_get('post_max_size') . "\n";
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage() . "\n";
} catch (Error $e) {
    echo "FATAL ERROR: " . $e->getMessage() . "\n";
}
