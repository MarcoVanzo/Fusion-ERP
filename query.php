<?php
require 'api/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require 'api/Shared/Database.php';
$db = \FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT id, tenant_id FROM foresteria_info");
var_dump($stmt->fetchAll(PDO::FETCH_ASSOC));
$stmt2 = $db->query("SELECT id, tenant_id, title FROM foresteria_media");
var_dump($stmt2->fetchAll(PDO::FETCH_ASSOC));
