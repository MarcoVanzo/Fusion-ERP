<?php
/**
 * Migration Synchronization Script — One-off use
 * Seeds the migrations tracking table without actually executing the SQL.
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use FusionERP\Shared\Database;

// Load environment variables
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

// Security Check
$expectedToken = getenv('MIGRATION_TOKEN') ?: ($_ENV['MIGRATION_TOKEN'] ?? '');
$providedToken = $_SERVER['HTTP_X_MIGRATION_TOKEN'] ?? ($_GET['token'] ?? '');

if (empty($expectedToken) || $providedToken !== $expectedToken) {
    http_response_code(403);
    die("Unauthorized (Invalid token)\n");
}

try {
    $db = Database::getInstance();
    $migrationsDir = __DIR__ . '/../db/migrations';
    $tableName = 'migrations';

    // 1. Ensure the table exists
    $db->exec("CREATE TABLE IF NOT EXISTS `$tableName` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `filename` VARCHAR(255) NOT NULL UNIQUE,
        `executed_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");

    // 2. Get all files
    $files = glob($migrationsDir . '/V*__*.sql');
    if ($files === false) die("No migration files found.\n");

    $basenames = array_map('basename', $files);
    sort($basenames);

    // 3. Get existing records
    $stmt = $db->query("SELECT filename FROM `$tableName`");
    $executed = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $synced = 0;
    foreach ($basenames as $file) {
        if (!in_array($file, $executed)) {
            $insert = $db->prepare("INSERT INTO `$tableName` (filename) VALUES (?)");
            $insert->execute([$file]);
            echo "✔ Synced: $file\n";
            $synced++;
        }
    }

    echo "\nTotal $synced files marked as executed in production.\n";

} catch (\Throwable $e) {
    die("Error: " . $e->getMessage() . "\n");
}
