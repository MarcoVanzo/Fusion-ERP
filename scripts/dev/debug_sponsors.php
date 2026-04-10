<?php
$host   = '31.11.39.161';
$dbname = 'Sql1804377_2';
$user   = 'Sql1804377';
$pass   = 'u3z4t994$@psAPr';

try {
    $dsn = "mysql:host={$host};dbname={$dbname};charset=utf8mb4";
    $db = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "--- All Sponsors in DB ---\n";
    $stmt = $db->query("SELECT id, name, tenant_id, is_active, is_deleted, sort_order FROM societa_sponsors");
    $rows = $stmt->fetchAll();
    foreach ($rows as $row) {
        echo "ID: {$row['id']} | Name: {$row['name']} | Tenant: {$row['tenant_id']} | Active: {$row['is_active']} | Deleted: {$row['is_deleted']} | Sort: {$row['sort_order']}\n";
    }

    echo "\n--- getPublicSponsors Query Simulation ---\n";
    $stmt = $db->query(
        "SELECT id, name, tipo, description, logo_path, website_url 
         FROM societa_sponsors 
         WHERE is_active = 1 AND is_deleted = 0
         ORDER BY sort_order ASC, name ASC"
    );
    $rows = $stmt->fetchAll();
    echo "Count: " . count($rows) . "\n";
    foreach ($rows as $row) {
        echo "Name: {$row['name']}\n";
    }

} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
