<?php
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/MigrationRunner.php';
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $migrationsDir = __DIR__ . '/db/migrations';
    $runner = new \FusionERP\Shared\MigrationRunner($db, $migrationsDir);
    $applied = $runner->run();
    echo "Applied: " . count($applied) . "\n";
    foreach ($applied as $m) echo " - $m\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
