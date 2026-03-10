<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

$db = Database::getInstance();
// Find athletes with > 1 team
$stmt = $db->query('
    SELECT at.athlete_id, a.full_name, COUNT(*) as team_count
    FROM athlete_teams at
    JOIN athletes a ON a.id = at.athlete_id
    GROUP BY at.athlete_id, a.full_name
    HAVING team_count > 1
');
$rows = $stmt->fetchAll();

echo "Athletes with multiple teams:\n";
print_r($rows);

if (!empty($rows)) {
    $firstId = $rows[0]['athlete_id'];
    echo "\nDetail for $firstId:\n";
    $stmt = $db->prepare('
        SELECT t.name, t.category
        FROM athlete_teams at
        JOIN teams t ON t.id = at.team_id
        WHERE at.athlete_id = :id
    ');
    $stmt->execute([':id' => $firstId]);
    print_r($stmt->fetchAll());
}