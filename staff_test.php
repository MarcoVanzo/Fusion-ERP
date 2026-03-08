<?php
/**
 * Quick staff API test — bypassa Auth per diagnosi
 * DELETE THIS FILE AFTER DEBUGGING!
 */
header('Content-Type: application/json');

if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo json_encode(['error' => 'No autoload']);
    exit;
}
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

// Init session but don't require auth
use FusionERP\Shared\Auth;
use FusionERP\Shared\TenantContext;

Auth::startSession();

try {
    // Load repository directly
    require_once __DIR__ . '/api/Modules/Staff/StaffRepository.php';
    $repo = new FusionERP\Modules\Staff\StaffRepository();
    $list = $repo->listStaff();
    echo json_encode(['success' => true, 'count' => count($list), 'data' => $list]);
}
catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'file' => str_replace('/web/htdocs/www.fusionteamvolley.it/home/', '', $e->getFile()),
        'line' => $e->getLine(),
        'trace' => array_slice(
        array_map(fn($f) => ($f['file'] ?? '?') . ':' . ($f['line'] ?? '?'), $e->getTrace()),
        0, 5
    )
    ]);
}