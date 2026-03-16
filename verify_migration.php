<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';

$dotenvPath = __DIR__ . '/';
if (file_exists($dotenvPath . '.env')) {
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable($dotenvPath);
    $dotenv->load();
}

try {
    $db = FusionERP\Shared\Database::getInstance();
    
    $sql = "ALTER TABLE teams ADD COLUMN gender ENUM('M', 'F') NULL DEFAULT NULL AFTER name;";
    try {
        $db->exec($sql);
        echo "Migration applied successfully! \n";
    } catch (Exception $e) {
        if (strpos($e->getMessage(), 'Duplicate column') !== false) {
             echo "Column 'gender' already exists. \n";
        } else {
             throw $e;
        }
    }
    
    $stmt = $db->query('SHOW COLUMNS FROM teams');
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns: " . implode(", ", $cols);
} catch (Exception $e) {
    echo "FATAL Error: " . $e->getMessage();
}
