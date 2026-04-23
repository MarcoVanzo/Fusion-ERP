<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

$db = \FusionERP\Shared\Database::getInstance();

$stmt = $db->prepare("SELECT id, vald_profile_id FROM athletes WHERE first_name LIKE '%Angelica%' AND last_name LIKE '%Olmesini%'");
$stmt->execute();
$athlete = $stmt->fetch(PDO::FETCH_ASSOC);

print_r($athlete);
