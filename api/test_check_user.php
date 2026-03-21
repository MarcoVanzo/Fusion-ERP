<?php
require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(dirname(__DIR__));
$dotenv->safeLoad();

use FusionERP\Shared\Database;

$db = Database::getInstance();
$stmt = $db->prepare('SELECT id, email, deleted_at FROM users WHERE email = ?');
$stmt->execute(['infoirenegirotto@gmail.com']);
$row = $stmt->fetch();

if ($row) {
    echo "Found user:\n";
    print_r($row);
} else {
    echo "User not found AT ALL.\n";
}
