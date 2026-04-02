<?php
require_once __DIR__ . '/vendor/autoload.php';

// Load .env
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Check tenants
    $stmt = $db->query("SELECT id, name FROM tenants");
    $tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "--- TENANTS ---\n";
    print_r($tenants);

    // Check Sponsors data distribution
    $stmt = $db->query("SELECT tenant_id, COUNT(*) as count FROM societa_sponsors GROUP BY tenant_id");
    echo "\n--- SPONSORS DATA ---\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    // Check Staff data distribution
    $stmt = $db->query("SELECT tenant_id, COUNT(*) as count FROM staff_members GROUP BY tenant_id");
    echo "\n--- STAFF DATA ---\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    // Check Results data distribution
    $stmt = $db->query("SELECT tenant_id, COUNT(*) as count FROM federation_championships GROUP BY tenant_id");
    echo "\n--- RESULTS (CHAMPIONSHIPS) DATA ---\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    // Check Scouting data distribution
    $stmt = $db->query("SELECT tenant_id, COUNT(*) as count FROM scouting_athletes GROUP BY tenant_id");
    echo "\n--- SCOUTING DATA ---\n";
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

    // Check current user in session (if any) - might not work via CLI but let's see
    session_start();
    echo "\n--- SESSION USER ---\n";
    print_r($_SESSION['user'] ?? 'No session user');

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
