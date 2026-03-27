<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->prepare('SELECT COUNT(*) FROM athletes WHERE id = :id');
    $stmt->execute([':id' => '1', ':extra' => '2']);
    echo "SUCCESS: Query executed even with extra parameters.";
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage();
}
