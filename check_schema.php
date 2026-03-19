<?php
require "vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require "api/Shared/Database.php";

$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("DESCRIBE societa_titoli");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
