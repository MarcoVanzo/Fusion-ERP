<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("DESCRIBE athletes");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo $col['Field'] . " - " . $col['Type'] . "\n";
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}