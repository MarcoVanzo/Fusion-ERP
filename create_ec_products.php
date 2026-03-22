<?php
declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Allow errors to be visible for this temporary script
ini_set('display_errors', '1');
error_reporting(E_ALL);

require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $db->exec("
    CREATE TABLE IF NOT EXISTS ec_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        prezzo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        immagineUrl TEXT,
        immagineBase64 LONGTEXT,
        immagineMimeType VARCHAR(50),
        descrizione TEXT,
        categoria VARCHAR(100),
        disponibile TINYINT(1) DEFAULT 1,
        importatoIl DATETIME,
        modificatoIl DATETIME
    );
    ");
    echo "SUCCESS_EC_PRODUCTS";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage();
}
