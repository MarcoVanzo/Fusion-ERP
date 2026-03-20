<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Carica variabili d'ambiente di produzione
$pdo = \FusionERP\Shared\Database::getInstance();

try {

    $sql = "
    ALTER TABLE `societa_sponsors` 
    ADD COLUMN `stagione` VARCHAR(50) NULL AFTER `name`,
    ADD COLUMN `importo` DECIMAL(10,2) NULL AFTER `tiktok_url`,
    ADD COLUMN `rapporto` DECIMAL(10,2) NULL AFTER `importo`,
    ADD COLUMN `sponsorizzazione` DECIMAL(10,2) NULL AFTER `rapporto`;
    ";
    
    $pdo->exec($sql);
    echo "SUCCESS_MIGRATION_V065\n";
} catch(PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "SUCCESS_MIGRATION_V065_ALREADY_EXISTS\n";
    } else {
        echo "ERROR: " . $e->getMessage() . "\n";
    }
} catch(Exception $e) {
    echo "GENERAL_ERROR: " . $e->getMessage() . "\n";
}
