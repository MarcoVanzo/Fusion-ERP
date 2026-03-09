<?php
/**
 * Flush OPcache and verify
 * DELETE AFTER USE
 */
header('Content-Type: application/json; charset=utf-8');

$secret = $_SERVER['HTTP_X_CRON_SECRET'] ?? '';
if (empty($secret) || $secret !== '291ba9c1a44e20e429680522f588a8deaab056d1d15cc7a6923fe77c8b05e67c') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

$results = [];

// 1. Get OPcache status before flush
if (function_exists('opcache_get_status')) {
    $status = opcache_get_status(false);
    $results['before'] = [
        'enabled' => $status['opcache_enabled'] ?? false,
        'cached_scripts' => $status['opcache_statistics']['num_cached_scripts'] ?? 0,
    ];

    // 2. Invalidate specific files
    $files = [
        dirname(__DIR__) . '/api/Modules/Dashboard/DashboardController.php',
        dirname(__DIR__) . '/api/Modules/Athletes/AthletesController.php',
        dirname(__DIR__) . '/api/Modules/Athletes/AthletesRepository.php',
        dirname(__DIR__) . '/api/shared/Auth.php',
        dirname(__DIR__) . '/api/router.php',
    ];

    foreach ($files as $f) {
        if (file_exists($f)) {
            $ok = opcache_invalidate($f, true);
            $results['invalidated'][] = basename($f) . ': ' . ($ok ? 'OK' : 'FAILED');
        }
    }

    // 3. Full reset
    $resetOk = opcache_reset();
    $results['full_reset'] = $resetOk ? 'OK' : 'FAILED';

    // 4. After flush
    $status2 = opcache_get_status(false);
    $results['after'] = [
        'cached_scripts' => $status2['opcache_statistics']['num_cached_scripts'] ?? 0,
    ];
}
else {
    $results['opcache'] = 'NOT AVAILABLE';
}

echo json_encode(['success' => true, 'results' => $results], JSON_PRETTY_PRINT);