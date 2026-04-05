<?php
require_once __DIR__ . '/../vendor/autoload.php';

// Load .env
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once __DIR__ . '/Shared/Database.php';
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

    // Check VALD fix
    require_once __DIR__ . '/Modules/Vald/ValdRepository.php';
    $vald = new \FusionERP\Modules\Vald\ValdRepository();
    echo "\n--- VALD REPO FIX CHECK ---\n";
    try {
        // Try to call with an existing athlete ID or dummy
        $stmt = $db->query("SELECT id FROM athletes WHERE tenant_id = 'TNT_fusion' LIMIT 1");
        $a = $stmt->fetch();
        if ($a) {
            echo "Testing athlete: " . $a['id'] . "\n";
            $res = $vald->getBaselineBrakingImpulse($a['id']);
            echo "VALD Result: " . (is_null($res) ? 'NULL (Success)' : $res) . "\n";
        } else {
            echo "No athletes found in TNT_fusion, skipping VALD check.\n";
        }
    } catch (Exception $ve) {
        echo "VALD ERROR STILL PRESENT: " . $ve->getMessage() . "\n";
    }

    // Check current user in session (if any) - might not work via CLI but let's see
    session_start();
    echo "\n--- SESSION USER ---\n";
    print_r($_SESSION['user'] ?? 'No session user');

    // Check Societa Sponsors schema fix
    echo "\n--- SCHEMA VERIFICATION (societa_sponsors) ---\n";
    $stmt = $db->query("SHOW COLUMNS FROM societa_sponsors WHERE Field IN ('rapporto', 'sponsorizzazione')");
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $col) {
        echo "Field: {$col['Field']}, Type: {$col['Type']}\n";
    }

    // Check Athletes schema synchronization (V028)
    echo "\n--- SCHEMA VERIFICATION (athletes extended) ---\n";
    $extendedFields = ['nationality', 'blood_group', 'allergies', 'medications', 'emergency_contact_name', 'emergency_contact_phone', 'communication_preference', 'image_release_consent', 'medical_cert_issued_at'];
    $placeholders = implode(',', array_fill(0, count($extendedFields), '?'));
    $stmt = $db->prepare("SHOW COLUMNS FROM athletes WHERE Field IN ($placeholders)");
    $stmt->execute($extendedFields);
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $found = array_column($cols, 'Field');
    foreach ($extendedFields as $f) {
        $status = in_array($f, $found) ? "PRESENT" : "MISSING ❌";
        echo "Field $f: $status\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
