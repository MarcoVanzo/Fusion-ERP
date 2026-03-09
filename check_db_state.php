<?php
// Read the DB error log table or file
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

$host = getenv('DB_HOST') ?: '31.11.39.161';
$port = getenv('DB_PORT') ?: '3306';
$db = getenv('DB_NAME') ?: 'Sql1804377_2';
$user = getenv('DB_USER') ?: 'Sql1804377';
$pass = getenv('DB_PASS') ?: 'u3z4t994$@psAPr';

try {
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Check staff_teams entries
    $stmt = $pdo->query("SELECT * FROM staff_teams ORDER BY created_at DESC LIMIT 10");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Recent staff_teams entries:\n";
    print_r($rows);

    // Check audit logs for the last update
    $stmt = $pdo->query("SELECT * FROM audit_logs WHERE table_name = 'staff_members' ORDER BY created_at DESC LIMIT 5");
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "\nRecent audit_logs for staff_members:\n";
    foreach ($logs as $log) {
        $changes = json_decode($log['changed_data'], true);
        echo "Action: {$log['action']}, Staff ID: {$log['entity_id']}\n";
        echo "Team IDs in Audit: " . json_encode($changes['team_ids'] ?? 'None') . "\n";
    }

}
catch (Exception $e) {
    echo "DB Error: " . $e->getMessage();
}