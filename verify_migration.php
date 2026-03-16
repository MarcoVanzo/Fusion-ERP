<?php
try {
    $db = new PDO("mysql:host=31.11.39.161;port=3306;dbname=Sql1804377_2;charset=utf8mb4", "Sql1804377", 'u3z4t994$@psAPr', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $sql = "ALTER TABLE teams ADD COLUMN gender ENUM('M', 'F') NULL DEFAULT NULL AFTER name;";
    $db->exec($sql);
    
    $stmt = $db->query('SHOW COLUMNS FROM teams');
    $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo implode(", ", $cols);
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column') !== false) {
        $stmt = $db->query('SHOW COLUMNS FROM teams');
        $cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "Column already exists! Cols: " . implode(", ", $cols);
    } else {
        echo "Error: " . $e->getMessage();
    }
}
