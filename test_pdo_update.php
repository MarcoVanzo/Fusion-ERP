<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->prepare('UPDATE athletes SET first_name = :n WHERE id = :id');
    $stmt->execute([':n' => 'Test', ':id' => 'NON_EXISTENT_ID']);
    echo "SUCCESS: Query executed. Affected rows: " . $stmt->rowCount() . "\n";
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage();
}
