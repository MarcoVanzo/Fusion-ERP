<?php
/**
 * diag_db.php — Database Connectivity Diagnostic
 * Use this to identify why the application cannot connect to MySQL.
 */
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "<html><head><title>DB Diagnostic</title><style>
    body { font-family: sans-serif; line-height: 1.6; padding: 20px; background: #f4f4f9; color: #333; }
    .card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    pre { background: #eee; padding: 10px; border-radius: 4px; overflow-x: auto; }
</style></head><body>";

echo "<h1>Database Connection Diagnostic</h1>";

// 1. PHP & Extensions
echo "<div class='card'><h2>1. Environment</h2>";
echo "PHP Version: " . PHP_VERSION . "<br>";
$pdo_available = extension_loaded('pdo_mysql');
echo "PDO MySQL Extension: " . ($pdo_available ? "<span class='success'>AVAILABLE</span>" : "<span class='error'>MISSING</span>") . "<br>";
echo "</div>";

// 2. .env Loading
echo "<div class='card'><h2>2. Configuration (.env)</h2>";
// Try to locate vendor/autoload.php
$autoload = __DIR__ . '/vendor/autoload.php';
if (file_exists($autoload)) {
    require_once $autoload;
    try {
        $dotenv = Dotenv\Dotenv::createMutable(__DIR__);
        $dotenv->load();
        echo "<span class='success'>.env file loaded successfully.</span><br>";
        
        $host = $_ENV['DB_HOST'] ?? 'NOT SET';
        $port = $_ENV['DB_PORT'] ?? 'NOT SET';
        $db   = $_ENV['DB_NAME'] ?? 'NOT SET';
        $user = $_ENV['DB_USER'] ?? 'NOT SET';
        $pass = $_ENV['DB_PASS'] ?? '';
        
        echo "Host: <strong>$host</strong><br>";
        echo "Port: <strong>$port</strong><br>";
        echo "DB Name: <strong>$db</strong><br>";
        echo "User: <strong>$user</strong><br>";
        echo "Password length: " . strlen($pass) . "<br>";
        
        if (str_starts_with($pass, "'") && str_ends_with($pass, "'")) {
            echo "<span class='error'>WARNING: Password is wrapped in single quotes. This might be literal!</span><br>";
        }
    } catch (Exception $e) {
        echo "<span class='error'>Error loading .env: " . $e->getMessage() . "</span>";
    }
} else {
    echo "<span class='error'>vendor/autoload.php not found. Make sure composer install was run.</span><br>";
}
echo "</div>";

// 3. Connection Test
if ($pdo_available && isset($host)) {
    echo "<div class='card'><h2>3. Connection Test</h2>";
    $dsn = "mysql:host={$host};port={$port};dbname={$db};charsets=utf8mb4";
    echo "Attempting connection to <code>$dsn</code>...<br>";
    
    $start = microtime(true);
    try {
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]);
        $end = microtime(true);
        echo "<span class='success'>SUCCESS! Connection established in " . round($end - $start, 3) . "s.</span><br>";
        
        $stmt = $pdo->query("SELECT VERSION() as version");
        $version = $stmt->fetchColumn();
        echo "Server Version: $version";
        
    } catch (PDOException $e) {
        $end = microtime(true);
        echo "<span class='error'>CONNECTION FAILED after " . round($end - $start, 3) . "s.</span><br>";
        echo "<h3>Error Detail:</h3>";
        echo "<pre>" . htmlspecialchars($e->getMessage()) . "</pre>";
        echo "Error Code: " . $e->getCode() . "<br>";
        
        if ($e->getCode() == 2002) {
            echo "<em>Note: 2002 usually means the server is unreachable (down or firewall).</em>";
        } elseif ($e->getCode() == 1045) {
            echo "<em>Note: 1045 means 'Access Denied' (wrong user or password).</em>";
        }
    }
    echo "</div>";
}

echo "</body></html>";
