<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();
try {
    $db = FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SELECT * FROM migrations ORDER BY id DESC LIMIT 20");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (Exception $e) {
    echo $e->getMessage();
}
