<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

echo "Test Start\n";

require_once __DIR__ . '/api/shared/Database.php';

echo "Attempting DB connection...\n";
try {
    $db = \FusionERP\Shared\Database::getInstance();
    echo "Connected successfully.\n";
}
catch (\Throwable $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}