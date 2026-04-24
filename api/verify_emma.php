<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once __DIR__ . '/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Check if she is returned by the same query used in listAthletesLight
    $sql = "SELECT DISTINCT a.id, a.team_id, a.full_name, a.is_active, a.deleted_at, a.tenant_id,
                   (SELECT GROUP_CONCAT(at_sub.team_season_id SEPARATOR ',') FROM athlete_teams at_sub WHERE at_sub.athlete_id = a.id) AS team_season_ids
            FROM athletes a
            WHERE a.first_name LIKE '%Emma%' AND a.last_name LIKE '%Romanel%'";
            
    $stmt = $db->prepare($sql);
    $stmt->execute();
    $athletes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Raw database state for Emma Romanel:\n";
    print_r($athletes);
    
    echo "\nTrying to run the exact listAthletesLight query logic...\n";
    require_once __DIR__ . '/Modules/Athletes/AthletesRepository.php';
    require_once __DIR__ . '/Shared/TenantContext.php';
    
    // Force tenant context if needed, but normally it relies on session.
    // Let's just run the exact WHERE clause from listAthletesLight manually:
    $tid = 'TNT_default';
    
    $sqlList = "SELECT DISTINCT a.id, a.full_name, a.is_active, a.tenant_id
                FROM athletes a
                LEFT JOIN teams t ON a.team_id = t.id
                WHERE a.deleted_at IS NULL AND a.tenant_id = :tid AND a.is_active = 1
                AND a.first_name LIKE '%Emma%'";
                
    $stmtList = $db->prepare($sqlList);
    $stmtList->execute([':tid' => $tid]);
    $list = $stmtList->fetchAll(PDO::FETCH_ASSOC);
    
    echo "\nResults from listAthletesLight WHERE clause (tenant: $tid):\n";
    print_r($list);
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
