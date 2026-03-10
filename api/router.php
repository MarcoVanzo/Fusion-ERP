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

// Prevent CDN/proxy caching of API responses — Aruba's proxy ignores 'private'
// and caches even session-dependent responses, causing stale/empty results.
// Browser-side caching is handled by the JS Store layer instead.
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');
header('Vary: Cookie');

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
            'website' => dispatch('Website', $action),
            'outseason' => dispatch('OutSeason', $action),
            'results' => dispatch('Results', $action),
            'vald' => dispatch('Vald', $action),
            'finance' => dispatch('Finance', $action),
            'biometrics' => dispatch('Biometrics', $action),
            'federation' => dispatch('Federation', $action),
            'documents' => dispatch('Documents', $action),
            'payments' => dispatch('Payments', $action),
            'health' => dispatch('Health', $action),
            'tournaments' => dispatch('Tournaments', $action),
            'vehicles' => dispatch('Vehicles', $action),
            'tasks' => dispatch('Tasks', $action),
            'staff' => dispatch('Staff', $action),
            'ecommerce' => dispatch('Ecommerce', $action),
            'newsletter' => dispatch('Newsletter', $action),
            'societa' => dispatch('Societa', $action),
            'network' => dispatch('Network', $action),
            'esignature' => dispatch('ESignature', $action),
            'whatsapp' => dispatchWebhook($action),
            default => Response::error("Modulo '{$module}' non trovato", 404),
        };
}
catch (\Throwable $e) {
    error_log('[ROUTER] Unhandled exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    Response::error('PHP_ERROR: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(), 400);
}

/**
 * Dispatch WhatsApp:
 *   - verify / receive → WebhookController (pubblico, no Auth)
 *   - tutto il resto   → WhatsAppController (autenticato)
 */
function dispatchWebhook(string $action): void
{
    $publicActions = ['verify', 'receive'];

    if (in_array($action, $publicActions, true)) {
        require_once __DIR__ . '/Modules/WhatsApp/WhatsAppWebhookController.php';
        $controller = new \FusionERP\Modules\WhatsApp\WhatsAppWebhookController();
    }
    else {
        require_once __DIR__ . '/Modules/WhatsApp/WhatsAppController.php';
        $controller = new \FusionERP\Modules\WhatsApp\WhatsAppController();
    }

    if (!method_exists($controller, $action)) {
        \FusionERP\Shared\Response::error("Azione WhatsApp '{$action}' non trovata", 404);
    }
    $controller->$action();
}

/**
 * Load and call the appropriate controller method.
 */
function dispatch(string $controllerName, string $action): void
{
    $class = "FusionERP\\Modules\\{$controllerName}\\{$controllerName}Controller";

    if (!class_exists($class)) {
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