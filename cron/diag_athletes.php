<?php
/**
 * Diagnostic: simulate the exact router path for athletes/listLight
 * DELETE AFTER USE
 */
declare(strict_types=1);
ini_set('display_errors', '1');
error_reporting(E_ALL);
header('Content-Type: application/json; charset=utf-8');

$secret = $_SERVER['HTTP_X_CRON_SECRET'] ?? '';
if (empty($secret) || $secret !== '291ba9c1a44e20e429680522f588a8deaab056d1d15cc7a6923fe77c8b05e67c') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

try {
    // Simulate the exact bootstrap path
    require_once dirname(__DIR__) . '/vendor/autoload.php';
    $dotenv = \Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
    $dotenv->load();

    // Check OPcache
    $opcache = function_exists('opcache_get_status') ? opcache_get_status(false) : null;
    $results = ['opcache_enabled' => $opcache['opcache_enabled'] ?? 'N/A'];

    // 1. Try instantiating AthletesRepository directly
    $results['step'] = 'creating_repo';
    $repo = new \FusionERP\Modules\Athletes\AthletesRepository();

    // 2. Try calling listAthletesLight
    $results['step'] = 'calling_listAthletesLight';
    $athletes = $repo->listAthletesLight('');
    $results['count'] = count($athletes);

    // 3. Try JSON encoding (could fail with binary data in photo_path etc.)
    $results['step'] = 'json_encoding';
    $json = json_encode(['success' => true, 'data' => $athletes]);
    if ($json === false) {
        $results['json_error'] = json_last_error_msg();
        // Try encoding without photo data
        foreach ($athletes as &$a) {
            if (isset($a['photo_path']) && !mb_check_encoding($a['photo_path'], 'UTF-8')) {
                $a['photo_path'] = '[BINARY_DATA]';
            }
        }
        $json = json_encode(['success' => true, 'data' => $athletes]);
        $results['json_retry'] = $json !== false ? 'OK after cleanup' : json_last_error_msg();
    }
    else {
        $results['json_size'] = strlen($json);
    }

    // 4. Check Response::success behavior
    $results['step'] = 'all_passed';

    echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT);

}
catch (\Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
    ], JSON_PRETTY_PRINT);
}