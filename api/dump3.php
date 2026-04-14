<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->prepare("SELECT id, first_name, last_name, vald_profile_id FROM athletes WHERE last_name LIKE '%Olmesini%'");
$stmt->execute();
$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "---- Athletes ----\n";
print_r($data);
