<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();
require_once 'api/Shared/Database.php';

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT id, label, url FROM federation_championships");
$champs = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($champs);