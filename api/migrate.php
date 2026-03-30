<?php
/**
 * Migration Endpoint — Automated database migrations for Fusion ERP
 * v1.0
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use FusionERP\Shared\MigrationRunner;

// Load environment variables
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

// 1. Security Check
$expectedToken = getenv('MIGRATION_TOKEN') ?: ($_ENV['MIGRATION_TOKEN'] ?? '');
$providedToken = $_SERVER['HTTP_X_MIGRATION_TOKEN'] ?? ($_GET['token'] ?? '');

if (empty($expectedToken) || $providedToken !== $expectedToken) {
    http_response_code(403);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['success' => false, 'error' => 'Accesso non autorizzato (Invalid Migration Token)']);
    exit;
}

// 2. Run Migrations
try {
    $db = Database::getInstance();
    $migrationsDir = __DIR__ . '/../db/migrations';
    
    $runner = new MigrationRunner($db, $migrationsDir);
    $applied = $runner->run();

    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success' => true,
        'message' => count($applied) > 0 ? 'Migrazioni applicate con successo.' : 'Database già aggiornato.',
        'applied' => $applied
    ]);
} catch (\Throwable $e) {
    error_log("[MIGRATION ERROR] " . $e->getMessage());
    
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
