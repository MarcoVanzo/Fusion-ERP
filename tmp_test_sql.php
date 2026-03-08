<?php
try {
    $pdo = new PDO(
        "mysql:host=31.11.39.161;port=3306;dbname=Sql1804377_2;charset=utf8mb4",
        'Sql1804377', 'u3z4t994$@psAPr',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    
    $stmt = $pdo->query("SELECT COUNT(*) FROM athletic_metrics");
    $count = $stmt->fetchColumn();
    echo "Total rows in athletic_metrics: $count\n\n";

    if ($count > 0) {
        $stmt = $pdo->query("SELECT metric_type, COUNT(*) as c FROM athletic_metrics GROUP BY metric_type");
        print_r($stmt->fetchAll());
        
        $stmt = $pdo->query("SELECT * FROM athletic_metrics LIMIT 5");
        print_r($stmt->fetchAll());
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}