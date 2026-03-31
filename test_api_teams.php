<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';

// Load .env
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Modules\Athletes\AthletesController;

// Mock session if needed
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

try {
    $controller = new AthletesController();
    
    // We expect Response::success to echo JSON and exit.
    // To capture it, we'll use output buffering if Response::success exits.
    // Actually, looking at router.php, it's designed to be called in a web context.
    
    echo "Testing AthletesController::getPublicTeams...\n";
    
    // Let's call it and see if it outputs JSON.
    // Note: Response::success calls exit() usually.
    $controller->getPublicTeams();
    
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "\n";
}
