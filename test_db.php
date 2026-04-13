<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/Database.php';

$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

$db = FusionERP\Shared\Database::getInstance();
$stmt = $db->query("SELECT id, nome, cognome, email, data_registrazione FROM talent_day_entries ORDER BY id DESC LIMIT 5");
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

print_r($rows);
