<?php
/**
 * Diagnostic script to check data distribution across tenants.
 */
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/TenantContext.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

// Mock environment variables if needed
$_ENV['DB_HOST'] = '31.11.39.161';
$_ENV['DB_NAME'] = 'Sql1804377_2';
$_ENV['DB_USER'] = 'Sql1804377';
$_ENV['DB_PASS'] = 'u3z4t994$@psAPr';

try {
    $db = Database::getInstance();

    echo "--- TENANTS ---\n";
    $stmt = $db->query("SELECT id, name, domain, is_active FROM tenants");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        printf("ID: %-15s | Name: %-20s | Domain: %s\n", $row['id'], $row['name'], $row['domain']);
    }

    $tables = [
        'societa_sponsors' => 'Sponsors',
        'staff_members'    => 'Staff Members',
        'scouting_athletes' => 'Scouting Athletes',
        'federation_championships' => 'Championships'
    ];

    foreach ($tables as $table => $label) {
        echo "\n--- $label COUNT BY TENANT ---\n";
        try {
            $stmt = $db->prepare("SELECT tenant_id, COUNT(*) as count FROM $table GROUP BY tenant_id");
            $stmt->execute();
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                printf("Tenant: %-15s | Count: %d\n", $row['tenant_id'], $row['count']);
            }
        } catch (Exception $e) {
            echo "Error querying $table: " . $e->getMessage() . "\n";
        }
    }

    echo "\n--- USERS TENANT ASSOCIATION ---\n";
    $stmt = $db->query("SELECT id, email, role, tenant_id FROM users");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        printf("User: %-30s | Role: %-15s | Tenant: %s\n", $row['email'], $row['role'], $row['tenant_id']);
    }

} catch (Exception $e) {
    echo "CRITICAL ERROR: " . $e->getMessage() . "\n";
}
