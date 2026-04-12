<?php
require_once __DIR__ . '/vendor/autoload.php';
$_GET['id'] = 'TRN_cfd5300f'; // Bussinello tournament ID from their DB
$_SERVER['REQUEST_URI'] = '/api/router.php?module=tournaments&action=generateSummaryPdf&id=TRN_cfd5300f';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST'] = 'localhost';

define('APP_ENV', 'testing');

require_once __DIR__ . '/api/core/Auth.php';
// Mock auth bypass
class MockAuth {
    public static function requireRead($param) { return true; }
    public static function requireWrite($param) { return true; }
}

// We just want to see if TournamentsController->generateSummaryPdf throws an error
require_once __DIR__ . '/api/modules/Tournaments/TournamentsController.php';

$c = new \FusionERP\Modules\Tournaments\TournamentsController();
try {
    $c->generateSummaryPdf();
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
