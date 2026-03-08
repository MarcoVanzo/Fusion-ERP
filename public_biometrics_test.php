<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

try {
    $db = new PDO(
        "mysql:host=" . $_ENV['DB_HOST'] . ";port=" . $_ENV['DB_PORT'] . ";dbname=" . $_ENV['DB_NAME'] . ";charset=utf8mb4",
        $_ENV['DB_USER'],
        $_ENV['DB_PASS'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );

    $stmt = $db->query("SELECT DISTINCT tenant_id FROM athletes");
    $tenants = $stmt->fetchAll(PDO::FETCH_COLUMN);

    foreach ($tenants as $tenantId) {
        if ($tenantId === 'TNT_default') continue;
        
        try {
            // Replicate BiometricsRepository::getGroupMetrics step 1
            $whereSql = 'a.tenant_id = :tenant_id AND a.deleted_at IS NULL';
            $params = [':tenant_id' => $tenantId];
            
            $athleteStmt = $db->prepare(
                "SELECT a.id, a.first_name, a.last_name,
                        CONCAT(a.first_name, ' ', a.last_name) AS full_name,
                        a.jersey_number, a.role, a.height_cm, a.weight_kg,
                        t.id AS team_id, t.name AS team_name, t.category
                 FROM athletes a
                 LEFT JOIN teams t ON t.id = a.team_id
                 WHERE {$whereSql}
                 ORDER BY t.name, a.last_name, a.first_name"
            );
            $athleteStmt->execute($params);
            $athletes = $athleteStmt->fetchAll(PDO::FETCH_ASSOC);

            if (empty($athletes)) {
                echo "Tenant [$tenantId]: 0 athletes<br>\n";
                continue;
            }

            $athleteIds = array_column($athletes, 'id');
            $inList = implode(',', array_fill(0, count($athleteIds), '?'));

            // Replicate BiometricsRepository::getGroupMetrics step 2
            $metricStmt = $db->prepare(
                "SELECT am.athlete_id, am.metric_type, am.value, am.unit, am.record_date
                 FROM athletic_metrics am
                 INNER JOIN (
                     SELECT athlete_id, metric_type, MAX(record_date) AS max_date
                     FROM athletic_metrics
                     WHERE athlete_id IN ($inList)
                     GROUP BY athlete_id, metric_type
                 ) latest ON am.athlete_id = latest.athlete_id
                          AND am.metric_type = latest.metric_type
                          AND am.record_date = latest.max_date
                 WHERE am.athlete_id IN ($inList)"
            );
            
            // This is the SUSPECT line causing the PDO bug "array_merge"
            $metricStmt->execute(array_merge($athleteIds, $athleteIds));
            $metrics = $metricStmt->fetchAll(PDO::FETCH_ASSOC);

            echo "Tenant [$tenantId]: OK - " . count($athletes) . " athletes, " . count($metrics) . " metrics<br>\n";

        } catch (Exception $e) {
            echo "Tenant [$tenantId]: ERROR - " . $e->getMessage() . "<br>\n";
        }
    }
} catch (Exception $e) {
    echo "GENERAL ERROR: " . $e->getMessage() . "<br>\n";
}