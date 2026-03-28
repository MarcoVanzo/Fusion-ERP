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
// createImmutable: does NOT overwrite variables already set in the environment
// (e.g. via Apache SetEnv in .htaccess). This lets server-level env vars take
// precedence over .env file values, which is important for VALD credentials.
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

// Global Error Handler to ensure JSON responses on fatal errors
set_error_handler(function($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return;
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

set_exception_handler(function(\Throwable $e) {
    $errMsg = '[ROUTER FATAL] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
    error_log($errMsg);

    $debug = filter_var(getenv('APP_DEBUG') ?: ($_ENV['APP_DEBUG'] ?? false), FILTER_VALIDATE_BOOLEAN);
    if ($debug) {
        // Write extended logs only in debug mode — avoid information-disclosure in production
        file_put_contents(__DIR__ . '/../local_debug_error.log', date('Y-m-d H:i:s') . ' ' . $errMsg . PHP_EOL, FILE_APPEND);
    }

    if (ob_get_level() > 0) ob_clean();
    http_response_code(500);
    header('Content-Type: application/json; charset=UTF-8');

    $clientMessage = $debug ? $errMsg : 'Errore interno del server.';
    echo json_encode(['success' => false, 'error' => $clientMessage]);
    exit;
});

// Start output buffering to prevent dirty JSON responses from random echoes/warnings
ob_start();

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

// Only accept POST (or OPTIONS for CORS preflight, GET for lists, PUT for updates)
if (!in_array($_SERVER['REQUEST_METHOD'], ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'])) {
    Response::error('Metodo non consentito', 405);
}

// Security: Require X-Requested-With header for all state-changing requests (CSRF protection)
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'DELETE'])) {
    $requestedWith = $_SERVER['HTTP_X_REQUESTED_WITH'] ?? '';
    if (strtolower($requestedWith) !== 'xmlhttprequest') {
        Response::error('Richiesta non autorizzata (Missing Security Header)', 403);
    }
}

// Parse routing params — ?module=auth&action=login
$module = filter_input(INPUT_GET, 'module', FILTER_DEFAULT) ?? '';
$action = filter_input(INPUT_GET, 'action', FILTER_DEFAULT) ?? '';

if (empty($module) || empty($action)) {
    Response::error('Parametri di routing mancanti', 400);
}

// ─── MODULE DISPATCH ──────────────────────────────────────────────────────────
try {
    match ($module) {
            'auth' => dispatch('Auth', $action),
            'athletes' => dispatch('Athletes', $action),
            'teams' => dispatch('Teams', $action),
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
            'scouting' => dispatch('Scouting', $action),
            'esignature' => dispatch('ESignature', $action),
            'tenant' => dispatch('Tenant', $action),
            'whatsapp' => dispatchWebhook($action),
            default => Response::error("Modulo '{$module}' non trovato", 404),
        };
}
catch (\Throwable $e) {
    $errMsg = '[ROUTER] Unhandled exception: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine();
    error_log($errMsg);

    // Security: Only expose full error detail in DEBUG mode — avoid information-disclosure in production.
    $isDebug = filter_var(getenv('APP_DEBUG') ?: ($_ENV['APP_DEBUG'] ?? false), FILTER_VALIDATE_BOOLEAN);
    if ($isDebug) {
        file_put_contents(__DIR__ . '/../local_debug_error.log', date('Y-m-d H:i:s') . ' ' . $errMsg . PHP_EOL, FILE_APPEND);
    }

    $clientMessage = $isDebug
        ? 'PHP_ERROR: ' . $e->getMessage() . ' in ' . basename($e->getFile()) . ':' . $e->getLine()
        : 'Errore interno del server. Contattare l\'amministratore.';

    Response::error($clientMessage, 500);
} finally {
    // Robustness: Force database disconnection and trigger garbage collection
    if (class_exists('FusionERP\\Shared\\Database')) {
        \FusionERP\Shared\Database::disconnect();
    }
    
    // Cleanup: help PHP release memory from large result sets or circular references
    gc_collect_cycles();
    
    if (ob_get_level() > 0) {
        ob_end_flush();
    }
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
        $class = "FusionERP\\Modules\\WhatsApp\\WhatsAppWebhookController";
    }
    else {
        $class = "FusionERP\\Modules\\WhatsApp\\WhatsAppController";
    }

    if (!class_exists($class)) {
        Response::error("Controller WhatsApp non trovato", 500);
    }
    
    $controller = new $class();

    if (!method_exists($controller, $action)) {
        Response::error("Azione WhatsApp '{$action}' non trovata", 404);
    }
    
    $controller->$action();
}

/**
 * Load and call the appropriate controller method.
 */
function dispatch(string $controllerName, string $action): void
{
    // FIX: Auth middleware globale. Richiede login per TUTTE le action tranne quelle esplicitamente pubbliche.
    $publicActions = ['login', 'requestPasswordReset', 'confirmPasswordReset', 'getPublicTeams', 'getPublicTeamAthletes', 'getPublicSponsors', 'getPublicProfile', 'getPublicForesteria', 'getPublicCollaborations', 'getPublicHubConfig', 'getPublicNews', 'getArticle', 'getSitemapUrls', 'getPublicShop', 'getProductImage', 'getPublicMatchCenter', 'getPublicStaff', 'getPublicRecentResults', 'subscribeNewsletter', 'teams'];
    if (!in_array($action, $publicActions, true)) {
        Auth::requireAuth();
    }

    $class = "FusionERP\\Modules\\{$controllerName}\\{$controllerName}Controller";

    // Rely on Composer's PSR-4 autoloader to load the class implicitly
    if (!class_exists($class)) {
        Response::error("Controller '{$controllerName}' non valido o non trovato", 404);
    }

    $controller = new $class();

    if (!method_exists($controller, $action)) {
        Response::error("Azione '{$action}' non trovata nel modulo '{$controllerName}'", 404);
    }

    $controller->$action();
}