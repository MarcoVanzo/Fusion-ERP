<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT * FROM societa_sponsors LIMIT 1");
    echo "SUCCESS: " . json_encode($stmt->fetchAll()) . "\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
