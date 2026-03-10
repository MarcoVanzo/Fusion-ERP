<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

require_once __DIR__ . '/api/Shared/Database.php';
use FusionERP\Shared\Database;

$db = Database::getInstance();
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$sql = "
CREATE TABLE IF NOT EXISTS athlete_teams (
    athlete_id  VARCHAR(32)  NOT NULL,
    team_id     VARCHAR(32)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (athlete_id, team_id),
    KEY idx_athlete_teams_team   (team_id),
    KEY idx_athlete_teams_athlete (athlete_id),
    CONSTRAINT fk_at_athlete FOREIGN KEY (athlete_id) REFERENCES athletes (id) ON DELETE CASCADE,
    CONSTRAINT fk_at_team    FOREIGN KEY (team_id)    REFERENCES teams    (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO athlete_teams (athlete_id, team_id)
SELECT id, team_id
FROM athletes
WHERE team_id IS NOT NULL
  AND deleted_at IS NULL;
";

try {
    $db->exec($sql);
    echo "Table athlete_teams created and populated successfully.\n";
}
catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}