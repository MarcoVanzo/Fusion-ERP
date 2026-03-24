<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/Database.php';
Dotenv\Dotenv::createImmutable(__DIR__)->load();
$db = FusionERP\Shared\Database::getInstance();
$stmt = $db->query('SHOW INDEXES FROM outseason_verifications');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
