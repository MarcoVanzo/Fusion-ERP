<?php
/**
 * Self-Heal script to fix user-tenant associations and data strands.
 * Moves 'TNT_default' records to 'TNT_fusion' for primary tables and users.
 */
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once __DIR__ . '/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    $db->beginTransaction();

    echo "--- 1. Ensuring TNT_fusion exists in tenants table ---\n";
    $stmt = $db->prepare("INSERT IGNORE INTO tenants (id, name, is_active) VALUES ('TNT_fusion', 'Fusion Team Volley', 1)");
    $stmt->execute();

    echo "--- 2. Updating users stuck in TNT_default ---\n";
    $stmt = $db->prepare("UPDATE tenant_users SET tenant_id = 'TNT_fusion' WHERE tenant_id = 'TNT_default'");
    $stmt->execute();
    echo "Updated " . $stmt->rowCount() . " user assignments.\n";

    $tables = [
        'societa_sponsors',
        'staff_members',
        'scouting_athletes',
        'federation_championships',
        'societa_profile',
        'societa_roles',
        'societa_documents',
        'societa_deadlines',
        'foresteria_info',
        'foresteria_media',
        'foresteria_expenses'
    ];

    echo "--- 3. Migrating data records from TNT_default to TNT_fusion ---\n";
    foreach ($tables as $table) {
        $stmt = $db->prepare("UPDATE $table SET tenant_id = 'TNT_fusion' WHERE tenant_id = 'TNT_default'");
        $stmt->execute();
        echo "Table $table: Moved " . $stmt->rowCount() . " records.\n";
    }

    $db->commit();
    echo "\n--- SUCCESS: Database self-healed. ---\n";
    echo "Users should log out and log back in to refresh their session tenant ID.\n";

} catch (Exception $e) {
    if (isset($db)) $db->rollBack();
    echo "FATAL ERROR during self-heal: " . $e->getMessage() . "\n";
}
