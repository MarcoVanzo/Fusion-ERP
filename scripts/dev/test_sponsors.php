<?php
require 'api/Shared/Database.php';
$db = \FusionERP\Shared\Database::getInstance();
try {
    $stmt = $db->query('SELECT * FROM societa_sponsors LIMIT 1');
    print_r($stmt->fetchAll());
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
