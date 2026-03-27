<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->prepare('UPDATE athletes SET non_existent_col = :n WHERE id = :id');
    $stmt->execute([':n' => 'Test', ':id' => '123']);
    echo "SUCCESS: Query executed.";
} catch (Exception $e) {
    echo "EXCEPTION: " . $e->getMessage();
}
