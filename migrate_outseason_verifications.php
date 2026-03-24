<?php
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();
require_once __DIR__ . '/api/Shared/Database.php';

try {
    $pdo = FusionERP\Shared\Database::getInstance();
    $sql = "CREATE TABLE IF NOT EXISTS outseason_verifications (
        id                      INT UNSIGNED     NOT NULL AUTO_INCREMENT,
        season_key              VARCHAR(10)      NOT NULL COMMENT 'e.g. 2026',
        entry_name              VARCHAR(150)     NOT NULL COMMENT 'Full name from Cognito Forms',
        found                   TINYINT(1)       NOT NULL DEFAULT 0,
        confidence              ENUM('high','medium','low') NULL,
        transaction_date        VARCHAR(20)      NULL     COMMENT 'DD/MM/YYYY as returned by Gemini',
        transaction_amount      DECIMAL(10,2)    NULL,
        transaction_description TEXT             NULL,
        notes                   TEXT             NULL,
        verified_at             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        verified_by             VARCHAR(20)      NULL,
        PRIMARY KEY (id),
        UNIQUE KEY uq_season_entry (season_key, entry_name),
        INDEX idx_osv_season (season_key),
        CONSTRAINT fk_osv_user FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($sql);
    echo "Migration outseason_verifications applied successfully!";
} catch(Exception $e) {
    http_response_code(500);
    echo "Error applying migration: " . $e->getMessage();
}
