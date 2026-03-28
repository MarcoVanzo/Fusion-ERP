<?php
ini_set('display_errors', "1");
error_reporting(E_ALL);
require 'vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

use FusionERP\Modules\Finance\FinanceController;
try {
    $controller = new FinanceController();
    $controller->getChartOfAccounts();
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
