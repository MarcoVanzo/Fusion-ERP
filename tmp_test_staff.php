<?php
require_once 'api/config.php';
$db = db();
$stmt = $db->query("SELECT s.*, 
       GROUP_CONCAT(ts.id SEPARATOR ',') as team_season_ids,
       GROUP_CONCAT(COALESCE(CONCAT(t.category, ' — ', t.name), t.name) SEPARATOR ', ') as team_names
FROM staff_members s
LEFT JOIN staff_teams st ON s.id = st.staff_id
LEFT JOIN team_seasons ts ON st.team_season_id = ts.id
LEFT JOIN teams t ON ts.team_id = t.id AND t.deleted_at IS NULL
GROUP BY s.id LIMIT 1");
print_r($stmt->errorInfo());
