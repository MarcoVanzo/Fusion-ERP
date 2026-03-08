<?php
header('Content-Type: text/plain; charset=utf-8');
// Quick check: does StaffController exist and load correctly?
$path = __DIR__ . '/api/Modules/Staff/StaffController.php';
$repoPath = __DIR__ . '/api/Modules/Staff/StaffRepository.php';

echo "=== Staff Debug ===\n\n";
echo "StaffController.php exists: " . (file_exists($path) ? 'YES' : 'NO') . "\n";
echo "StaffRepository.php exists: " . (file_exists($repoPath) ? 'YES' : 'NO') . "\n\n";

// Check vendor autoload
$autoload = __DIR__ . '/vendor/autoload.php';
if (!file_exists($autoload)) {
    echo "MISSING: vendor/autoload.php\n";
    exit;
}
require_once $autoload;

// Load env
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

echo "DB_HOST: " . getenv('DB_HOST') . "\n";
echo "DB_NAME: " . getenv('DB_NAME') . "\n\n";

// Try DB connection
try {
    $pdo = new PDO(
        "mysql:host=" . getenv('DB_HOST') . ";dbname=" . getenv('DB_NAME') . ";charset=utf8mb4",
        getenv('DB_USER'), getenv('DB_PASS'),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    echo "DB connection: OK\n";

    // Check table
    $r = $pdo->query("SHOW TABLES LIKE 'staff_members'")->fetch();
    echo "Table staff_members: " . ($r ? 'EXISTS' : 'MISSING') . "\n";

    // Check tenant_id column
    $cols = $pdo->query("SHOW COLUMNS FROM staff_members")->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns: " . implode(', ', $cols) . "\n\n";

    // Try the actual query
    $tenantId = getenv('DEFAULT_TENANT_ID') ?: null;
    echo "TENANT_ID from env: " . ($tenantId ?: 'null') . "\n";

    // Check TenantContext
    require_once __DIR__ . '/api/Shared/TenantContext.php';
    session_start();
    // Simulate a session
    $_SESSION['user'] = ['id' => 'debug', 'role' => 'admin', 'permissions' => []];
    echo "TenantContext::id() = " . FusionERP\Shared\TenantContext::id() . "\n\n";

    // Run the actual repository method
    require_once $repoPath;
    require_once $path;
    require_once __DIR__ . '/api/Shared/DB.php';
    $repo = new FusionERP\Modules\Staff\StaffRepository();
    $list = $repo->listStaff();
    echo "listStaff() returned " . count($list) . " records\n";
    echo "✅ All OK!\n";

}
catch (Throwable $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . "\n";
    echo "Line: " . $e->getLine() . "\n";
}