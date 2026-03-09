<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Mock Auth
$_SESSION = ['user_id' => 'USR_admin0001', 'role' => 'admin'];
require_once __DIR__ . '/api/Shared/Database.php';

// We need an access token to trigger the insights correctly
$db = \FusionERP\Shared\Database::getInstance();
$token = $db->query("SELECT * FROM meta_tokens LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if (!$token) {
    echo "No token in DB.\n";
} else {
    echo "Token found for user: " . $token['user_id'] . "\n";
    $_SESSION['user_id'] = $token['user_id'];
    $_GET = ['module' => 'social', 'action' => 'insights'];
    require_once __DIR__ . '/api/router.php';
}
