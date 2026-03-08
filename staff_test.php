<?php
/**
 * Staff API test — simulates router.php context exactly
 * DELETE THIS FILE AFTER DEBUGGING!
 */
header('Content-Type: application/json');

// Change to api dir so autoloader resolves paths like router.php
$apiDir = __DIR__ . '/api';
chdir($apiDir);

if (!file_exists($apiDir . '/../vendor/autoload.php')) {
    echo json_encode(['error' => 'No autoload']);
    exit;
}
require_once $apiDir . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable($apiDir . '/..');
$dotenv->load();

use FusionERP\Shared\Auth;
Auth::startSession();

try {
    require_once $apiDir . '/Modules/Staff/StaffRepository.php';
    $repo = new FusionERP\Modules\Staff\StaffRepository();
    $list = $repo->listStaff();
    echo json_encode(['success' => true, 'count' => count($list), 'sample' => array_slice($list, 0, 2)]);
} catch (Throwable $e) {
    echo json_encode([
        'success' => false,
        'error'   => $e->getMessage(),
        'file'    => $e->getFile(),
        'line'    => $e->getLine(),
    ]);
}