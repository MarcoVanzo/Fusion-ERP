<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

use FusionERP\Shared\Database;

header('Content-Type: application/json');

ini_set('display_errors', 1);
error_reporting(E_ALL);

try {
    $db = Database::getInstance();
    $stmt = $db->query("SELECT
                    COUNT(*)                                                AS total_athletes,
                SUM(role        
    IS NOT NULL AND role <> '')      AS with_role,
 