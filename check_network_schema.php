<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SHOW COLUMNS FROM network_collaborations");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $logoPathExists = false;
    foreach ($cols as $col) {
        if ($col['Field'] === 'logo_path') {
            $logoPathExists = true;
            break;
        }
    }
    if (!$logoPathExists) {
        echo "MISSING logo_path column!\n";
    } else {
        echo "logo_path exists.\n";
    }
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage();
}
