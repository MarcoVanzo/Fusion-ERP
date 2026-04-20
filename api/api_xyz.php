<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();
try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT filename FROM migrations ORDER BY filename ASC");
    echo json_encode($stmt->fetchAll(PDO::FETCH_COLUMN));
} catch (Exception $e) {
    echo $e->getMessage();
}
