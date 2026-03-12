<?php
$rootDir = __DIR__;
require_once $rootDir . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable($rootDir);
$dotenv->load();

$pdo = \FusionERP\Shared\Database::getInstance();
$stmt = $pdo->query("SELECT id, filename, created_at, status FROM backups ORDER BY created_at DESC LIMIT 10");
$backups = $stmt->fetchAll(PDO::FETCH_ASSOC);

print_r($backups);
