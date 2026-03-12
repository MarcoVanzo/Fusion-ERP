<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $controller = new \FusionERP\Modules\Results\ResultsController();
    $controller->getPublicMatchCenter();
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
