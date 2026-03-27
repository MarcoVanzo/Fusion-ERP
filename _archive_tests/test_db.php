<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/Shared/Database.php';
try {
    $db = \FusionERP\Shared\Database::getInstance();
    $stmt = $db->query('DESCRIBE staff_teams');
    $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Columns in staff_teams:\n";
    print_r($cols);

    echo "\n\nTesting listStaff SQL:\n";
    $sql = "SELECT s.id, s.first_name, s.last_name,
                       CONCAT(s.first_name, ' ', s.last_name) AS full_name,
                       s.role, s.phone, s.email, s.medical_cert_expires_at,
                       s.photo_path, s.contract_status, s.contract_valid_from, s.contract_valid_to,
                       GROUP_CONCAT(ts.id SEPARATOR ',') as team_season_ids,
                       GROUP_CONCAT(COALESCE(CONCAT(t.category, ' — ', t.name), t.name) SEPARATOR ', ') as team_names
                FROM staff_members s
                LEFT JOIN staff_teams st ON s.id = st.staff_id
                LEFT JOIN team_seasons ts ON st.team_season_id = ts.id
                LEFT JOIN teams t ON ts.team_id = t.id AND t.deleted_at IS NULL
                WHERE s.tenant_id = 'test' AND s.is_deleted = 0
                GROUP BY s.id
                ORDER BY s.last_name ASC, s.first_name ASC";
    $stmt = $db->query($sql);
    echo "Query OK. Rows: " . count($stmt->fetchAll());
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage();
}