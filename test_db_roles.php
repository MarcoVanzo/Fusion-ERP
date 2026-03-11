<?php
$host = '31.11.39.161';
$db = 'Sql1804377_2';
$user = 'Sql1804377';
$pass = 'u3z4t994$@psAPr';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $stmt = $pdo->query("SHOW COLUMNS FROM tenant_users LIKE 'roles'");
    $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (count($res) > 0) {
        echo "✅ Column 'roles' exists in tenant_users.\n";
        print_r($res[0]);
    } else {
        echo "❌ Column 'roles' NOT FOUND in tenant_users.\n";
    }
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
