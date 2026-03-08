<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

echo "START<br>";

try {
    $db = new PDO(
        "mysql:host=31.11.39.161;port=3306;dbname=Sql1804377_2;charset=utf8mb4",
        "Sql1804377",
        "u3z4t994$@psAPr",
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]
        );
    echo "DB OK<br>";

    // Testing the array_merge PDO bug on production
    $athleteIds = [1, 2, 3];
    $inList = '?,?,?';

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

    $metricStmt->execute(array_merge($athleteIds, $athleteIds));
    $metrics = $metricStmt->fetchAll(PDO::FETCH_ASSOC);
    echo "QUERY OK, rows: " . count($metrics) . "<br>";

}
catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "<br>";
}
echo "END<br>";