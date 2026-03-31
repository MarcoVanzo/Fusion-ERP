<?php
// Load environment manually if needed
$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value, " \t\n\r\0\x0B\"'");
        putenv("$name=$value");
        $_ENV[$name] = $value;
    }
}

require_once 'api/Shared/Database.php';
use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    echo "Connected to: " . getenv('DB_NAME') . "\n";
    
    $total = $db->query("SELECT COUNT(*) FROM athletes WHERE deleted_at IS NULL")->fetchColumn();
    echo "Total Athletes: $total\n";
    
    $tenants = $db->query("SELECT id, name FROM tenants")->fetchAll(PDO::FETCH_ASSOC);
    echo "Tenants:\n";
    foreach($tenants as $t) echo "  - {$t['id']}: {$t['name']}\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
