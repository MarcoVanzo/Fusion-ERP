<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();
// Mock web context
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
// Mock session/auth bypass for testing
session_start();
$_SESSION['user_id'] = 1;
$_SESSION['role'] = 'admin'; // Has 'ecommerce' permission
$_SESSION['tenant_id'] = 1;

require_once 'api/Shared/Database.php';
require_once 'api/Modules/Ecommerce/EcommerceController.php';

$c = new FusionERP\Modules\Ecommerce\EcommerceController();
try {
    $c->getOrders();
} catch (Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString();
}
