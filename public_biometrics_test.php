<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

function fatal_handler() {
    $errfile = "unknown file";
    $errstr  = "shutdown";
    $errno   = E_CORE_ERROR;
    $errline = 0;

    $error = error_get_last();

    if( $error !== NULL) {
        $errno   = $error["type"];
        $errfile = $error["file"];
        $errline = $error["line"];
        $errstr  = $error["message"];
        echo "<br><b>FATAL_ERROR:</b> [$errno] $errstr in $errfile on line $errline<br>";
    }
}
register_shutdown_function( "fatal_handler" );

echo "Starting hardcoded biometrics test...<br>\n";

try {
    $db = new PDO(
        "mysql:host=31.11.39.161;port=3306;dbname=Sql1804377_2;charset=utf8mb4",
        "Sql1804377",
        "u3z4t994$@psAPr",
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ]
    );
    echo "DB Connected.<br>\n";

    $stmt = $db->query("SELECT DISTINCT tenant_id FROM athletes");
    $tenants = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Found " . count($tenants) . " tenants.<br>\n";

    foreach ($tenants as $tenantId) {
        if ($tenantId !== 'fusion') {
            try {
                $whereSql = 'a.tenant_id = :tenant_id AND a.deleted_at IS NULL';
                $params = [':tenant_id' => $tenantId];
                
                $athleteStmt = $db->prepare(
                    "SELECT a.id, a.team_id
                     FROM athletes a
                     LEFT JOIN teams t ON t.id = a.team_id
                     WHERE {$whereSql}"
                );
                $athleteStmt->execute($params);
                $athletes = $athleteStmt->fetchAll(PDO::FETCH_ASSOC);

                if (empty($athletes)) continue;

                $athleteIds = array_column($athletes, 'id');
                $inList = implode(',', array_fill(0, count($athleteIds), '?'));

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
                
                // The suspect array_merge line causing the PDO bug
                $metricStmt->execute(array_merge($athleteIds, $athleteIds));
                $metrics = $metricStmt->fetchAll(PDO::FETCH_ASSOC);

                echo "Tenant [$tenantId]: OK - " . count($athletes) . " athletes, " . count($metrics) . " metrics<br>\n";

            } catch (Exception $e) {
                echo "<br><h2>Tenant [$tenantId]: SQL ERROR! " . $e->getMessage() . "</h2><br>\n";
            }
        }
    }
} catch (Throwable $e) {
    echo "<br><b>THROWABLE CATCHED:</b> " . $e->getMessage();
}
echo "<br>Finished.";