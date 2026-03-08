<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/Auth.php';
require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $pdo = Database::getInstance();
    $sql = file_get_contents(__DIR__ . '/db/migrations/V040__add_round_to_federation_matches.sql');
    $pdo->exec($sql);
    echo "Migration V040 applied successfully.\n";

    $stmt = $pdo->query("DESCRIBE federation_matches");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($rows);
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}