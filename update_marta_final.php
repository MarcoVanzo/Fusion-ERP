<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $stmt = $db->prepare("UPDATE athletes SET team_id = 'TEAM_u18a' WHERE first_name LIKE 'Marta%' AND last_name LIKE 'Cigana%'");
    $stmt->execute();
    echo "Updated " . $stmt->rowCount() . " records for Marta Cigana.\n";
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}