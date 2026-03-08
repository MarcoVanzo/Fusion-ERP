<?php
require_once __DIR__ . '/api/config.php';
require_once __DIR__ . '/api/shared/Database.php';

use FusionERP\Shared\Database;

try {
    $pdo = Database::getInstance();
    $stmt = $pdo->query("DESCRIBE federation_matches");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($rows);
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}