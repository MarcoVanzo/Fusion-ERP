<?php
$_ENV['APP_DEBUG'] = 'true';
require_once __DIR__ . '/vendor/autoload.php';

// Bypass session requirement for DB tests
$_SESSION['user'] = ['tenant_id' => 'fusion']; // Mock tenant

// Add getenv mock
putenv("DB_HOST=127.0.0.1");
putenv("DB_USER=root");
putenv("DB_PASS=root");
putenv("DB_NAME=fusion_erp");

// Actually, let's just use the application's native setup via a real HTTP request if possible, or mock correctly.
// A simpler way: curl the API locally? But how to authenticate?
// I can just include the router and spoof $_SERVER variables.

// Instead of setting up the environment, let's just make a direct PDO connection using the .env file.
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

$host = $_ENV['DB_HOST'] ?? '127.0.0.1';
$db   = $_ENV['DB_NAME'] ?? 'fusion_erp';
$user = $_ENV['DB_USER'] ?? 'root';
$pass = $_ENV['DB_PASS'] ?? '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Simulate listStaff query
    $tenantId = 'T00001'; // or whatever tenant they use
    
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
            WHERE s.is_deleted = 0
            GROUP BY s.id
            ORDER BY s.last_name ASC, s.first_name ASC";
            
     $stmt = $pdo->prepare($sql);
     $stmt->execute();
     $res = $stmt->fetchAll(PDO::FETCH_ASSOC);
     echo "SUCCESS! " . count($res) . " results.\n";
} catch (Exception $e) {
     echo "SQL_ERROR: " . $e->getMessage() . "\n";
}
