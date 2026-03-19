<?php
require "vendor/autoload.php";
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require "api/Shared/Database.php";

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $stmt = $db->query("SHOW TABLES LIKE 'societa_titoli'");
    $tables = $stmt->fetchAll();
    
    if (empty($tables)) {
        echo "TABLE DOES NOT EXIST!\n";
    } else {
        echo "TABLE EXISTS.\nSchema:\n";
        $stmt = $db->query("DESCRIBE societa_titoli");
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
    }
} catch (\Exception $e) {
    echo "DB ERROR: " . $e->getMessage();
}
