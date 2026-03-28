<?php
require __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__), '.env');
$dotenv->safeLoad();

use FusionERP\Shared\Database;

try {
    $pdo = Database::getInstance();
    
    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM scouting_athletes LIKE 'tenant_id'");
    if ($stmt->fetch()) {
        echo "Column tenant_id already exists. OK.\n";
    } else {
        $pdo->exec("
            ALTER TABLE scouting_athletes
            ADD COLUMN tenant_id VARCHAR(30) NOT NULL DEFAULT 'TNT_default' AFTER id,
            ADD KEY idx_scounting_tenant (tenant_id)
        ");
        echo "Migration applied successfully.\n";
    }
} catch (Throwable $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
