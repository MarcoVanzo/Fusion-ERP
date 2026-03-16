<?php
require 'vendor/autoload.php';

$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        putenv(trim($line));
    }
}

require 'api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT u.role, t.roles as tenant_roles FROM users u LEFT JOIN tenant_users t ON u.id = t.user_id WHERE u.email='marco@mv-consulting.it'");
    print_r($stmt->fetch(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
