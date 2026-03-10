<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT id, first_name, last_name, team_id FROM athletes WHERE first_name LIKE 'Marta%' AND last_name LIKE 'Cigana%'");
    $marta = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($marta);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
