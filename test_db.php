<?php
require 'vendor/autoload.php';
$_ENV['APP_DEBUG'] = 'true';
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();
require 'api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    echo "Info:\n";
    $stmt = $db->query("SELECT * FROM foresteria_info");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    echo "Expenses:\n";
    $stmt = $db->query("SELECT * FROM foresteria_expenses LIMIT 1");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
    
    echo "Media:\n";
    $stmt = $db->query("SELECT * FROM foresteria_media LIMIT 1");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

} catch(Exception $e) {
    echo "ERR: " . $e->getMessage() . "\n";
}
