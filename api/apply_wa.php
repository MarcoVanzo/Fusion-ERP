<?php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();
try {
    $db = FusionERP\Shared\Database::getInstance();
    
    $sql1 = file_get_contents(__DIR__ . '/../db/migrations/V037_1__whatsapp_inbox.sql');
    $db->exec($sql1);
    
    $sql2 = file_get_contents(__DIR__ . '/../db/migrations/V039_1__contacts.sql');
    $db->exec($sql2);
    
    echo "Fatto!";
} catch (Exception $e) {
    echo "Errore: " . $e->getMessage();
}
