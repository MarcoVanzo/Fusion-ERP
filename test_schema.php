<?php
require __DIR__ . '/api/env_loader.php';
require __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    echo "Connected.\n";
    $stmt = $db->query("DESCRIBE injury_records");
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($res);
} catch (Exception $e) {
    echo $e->getMessage();
}
