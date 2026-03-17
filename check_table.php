<?php
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance()->getConnection();
    
    $stmt = $db->query("SHOW TABLES LIKE 'scouting_athletes'");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($tables) > 0) {
        echo "YES: Table scouting_athletes exists.";
    } else {
        echo "NO: Table scouting_athletes DOES NOT exist.";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
