<?php
/**
 * API Router — Single Entry Point
 * Fusion ERP v1.0
 *
 * All API requests are routed here via .htaccess:
 *   RewriteRule ^api/(.*)$ api/router.php [L,QSA]
 */

declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;

// Load environment variables from .env
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

// Initialize secure session
Auth::startSession();

// Set security headers & CORS
Response::setCorsHeaders();
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Only accept POST (or OPTIONS for CORS preflight)
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'GET', 'OPTIONS'])) {
    Response::error('Metodo non consentito', 405);
}

// Parse routing params — ?module=auth&action=login
$module = filter_input(INPUT_GET, 'module', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
$action = filter_input(INPUT_GET, 'action', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';

if (empty($module) || empty($action)) {
    Response::error('Parametri di routing mancanti', 400);
}

// ─── MODULE DISPATCH ──────────────────────────────────────────────────────────
try {
    match ($module) {
            'auth' => dispatch('Auth', $action),
            'athletes' => dispatch('Athletes', $action),
            'teams' => dispatch('Teams', $action),
            'events' => dispatch('Events', $action),
            'transport' => dispatch('Transport', $action),
            'admin' => dispatch('Admin', $action),
            'dashboard' => dispatch('Dashboard', $action),
            'social' => dispatch('Social', $action),
            'outseason' => dispatch('OutSeason', $action),
            'results' => dispatch('Results', $action),
            default => Response::error("Modulo '{$module}' non trovato", 404),
        };
}
catch (\Throwable $e) {
    error_log('[ROUTER] Unhandled exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    Response::error('Errore interno del server', 500, $e->getMessage());
}

/**
 * Load and call the appropriate controller method.
 */
function dispatch(string $controllerName, string $action): void
{
    $class = "FusionERP\\Modules\\{$controllerName}\\{$controllerName}Controller";

    if (!class_exists($class)) {
        // Lazy-load the file
        $filePath = __DIR__ . "/Modules/" . $controllerName . "/{$controllerName}Controller.php";
        if (!file_exists($filePath)) {
            Response::error("Controller '{$controllerName}' non trovato", 404);
        }
        require_once $filePath;
    }

    if (!class_exists($class)) {
        Response::error("Controller '{$controllerName}' non valido", 500);
    }

    $controller = new $class();

    if (!method_exists($controller, $action)) {
        Response::error("Azione '{$action}' non trovata nel modulo '{$controllerName}'", 404);
    }

    $controller->$action();
}