<?php
$token = $_GET['t'] ?? '';
if ($token !== 'fus10n_m1gr4te_v50') {
    die('Access Denied');
}
$env = file_get_contents(__DIR__ . '/.env');
preg_match('/DB_HOST=(.+)/', $env, $m1);
$host = trim(trim($m1[1]), "'\"");
preg_match('/DB_NAME=(.+)/', $env, $m2);
$name = trim(trim($m2[1]), "'\"");
preg_match('/DB_USER=(.+)/', $env, $m3);
$user = trim(trim($m3[1]), "'\"");
preg_match('/DB_PASS=(.+)/', $env, $m4);
$pass = trim(trim($m4[1]), "'\"");

$sql = file_get_contents(__DIR__ . '/db/migrations/V050__network_collab_logo.sql');

try {
    $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    $pdo->exec($sql);
    echo "Migration V050 executed successfully.\n";
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Self-delete
unlink(__FILE__);