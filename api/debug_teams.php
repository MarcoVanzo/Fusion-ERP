<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

$db = Database::getInstance();
header('Content-Type: application/json');

try {
    $tid = TenantContext::id();
    
    // Check teams for current tenant
    $teams = $db->query("SELECT id, name, tenant_id FROM teams WHERE tenant_id = '$tid'")->fetchAll();
    
    // Check athletes team_id distribution
    $athletes_teams = $db->query("SELECT team_id, COUNT(*) as cnt FROM athletes WHERE tenant_id = '$tid' GROUP BY team_id")->fetchAll();
    
    // Check if athlete_teams junction table exists and has records
    $junction = [];
    try {
        $junction = $db->query("SELECT tenant_id, COUNT(*) as cnt FROM athlete_teams GROUP BY tenant_id")->fetchAll();
    } catch (Exception $e) { $junction = 'Table not found or error'; }

    echo json_encode([
        'current_tenant' => $tid,
        'available_teams' => $teams,
        'athletes_team_id_stats' => $athletes_teams,
        'junction_table_status' => $junction
    ], JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
