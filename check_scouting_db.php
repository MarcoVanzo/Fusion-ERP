<?php
require_once __DIR__ . '/api/vendor/autoload.php';
$dbPath = __DIR__ . '/database.sqlite';
$db = new PDO("sqlite:$dbPath");
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// For local testing, just make sure table exists in SQLite as well so API doesn't crash
// if it tries to fallback to SQLite. Wait, the DB is MySQL right now?
// Let's print out what DB Database::getInstance() actually connects to!
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $mysqlDb = \FusionERP\Shared\Database::getInstance();
    $stmt = $mysqlDb->query("SHOW TABLES LIKE 'scouting_athletes'");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($tables)) {
        echo "Table scouting_athletes EXISTS in backend MySQL.\\n";
    } else {
        echo "Table scouting_athletes DOES NOT EXIST.\\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
