<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__ . '/api');
$dotenv->load();

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SHOW COLUMNS FROM network_collaborations LIKE 'logo_path'");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($cols)) {
        echo "MISSING logo_path column!\n";
    } else {
        echo "logo_path exists:\n";
        print_r($cols);
    }
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage();
}
