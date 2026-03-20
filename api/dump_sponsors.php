<?php
// Just dump the db content locally to see if id matches.
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->safeLoad();
$pdo = \FusionERP\Shared\Database::getInstance();
$stmt = $pdo->query("SELECT id, name, tenant_id FROM societa_sponsors");
print_r($stmt->fetchAll());
