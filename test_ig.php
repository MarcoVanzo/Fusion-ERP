<?php
require 'Shared/Database.php';
require '../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();
$db = \FusionERP\Shared\Database::getInstance();
$r = $db->query("SELECT * FROM meta_tokens ORDER BY updated_at DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($r);
$logs = $db->query("SELECT * FROM meta_logs ORDER BY created_at DESC LIMIT 10")->fetchAll(PDO::FETCH_ASSOC);
echo "\n\nLOGS:\n" . json_encode($logs);
