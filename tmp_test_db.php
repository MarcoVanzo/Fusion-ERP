<?php
$host = '31.11.39.161';
$db = 'Sql1804377_2';
$user = 'Sql1804377';
$pass = 'u3z4t994$@psAPr';
$port = 3306;

try {
    $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $stmt = $pdo->query("DESCRIBE staff_teams");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
