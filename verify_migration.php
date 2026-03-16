<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    $db = new PDO("mysql:host=31.11.39.161;port=3306;dbname=Sql1804377_2;charset=utf8mb4", "Sql1804377", 'u3z4t994$@psAPr', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

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
