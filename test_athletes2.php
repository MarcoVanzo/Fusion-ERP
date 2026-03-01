<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    require_once __DIR__ . '/vendor/autoload.php';
    require_once __DIR__ . '/api/Shared/Database.php';
    require_once __DIR__ . '/api/Modules/Athletes/AthletesRepository.php';

    // Load environment variables from .env if needed
    if (class_exists('Dotenv\Dotenv')) {
        $dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
        $dotenv->load();
    }

    $repo = new FusionERP\Modules\Athletes\AthletesRepository();
    echo "Testing listAthletes()...\n";
    $athletes = $repo->listAthletes();
    echo "Athletes via Repo: " . count($athletes) . "\n";

    // Direct DB check
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT COUNT(*) FROM athletes");
    echo "Total Athletes in DB: " . $stmt->fetchColumn() . "\n";

    $stmt2 = $db->query("SELECT COUNT(*) FROM athletes WHERE deleted_at IS NULL AND is_active = 1");
    echo "Total Active NOT Deleted Athletes in DB: " . $stmt2->fetchColumn() . "\n";

}
catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}