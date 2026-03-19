<?php
try {
    $pdo = new PDO(
        'mysql:host=31.11.39.161;port=3306;dbname=Sql1804377_2;charset=utf8mb4',
        'Sql1804377',
        'u3z4t994$@psAPr',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    $stmt = $pdo->query("SHOW TABLES LIKE 'societa_titoli'");
    $tables = $stmt->fetchAll();
    
    if (empty($tables)) {
        echo "TABLE DOES NOT EXIST!\n";
    } else {
        echo "TABLE EXISTS.\nSchema:\n";
        $stmt = $pdo->query("DESCRIBE societa_titoli");
        print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
} catch (\Exception $e) {
    echo "DB ERROR: " . $e->getMessage();
}
