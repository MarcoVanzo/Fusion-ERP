<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = \Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

require_once __DIR__ . '/api/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    $db->exec("ALTER TABLE societa_sponsors ADD COLUMN tipo VARCHAR(50) DEFAULT 'Sponsor' AFTER name;");
    echo json_encode(['success' => true, 'message' => "Colonna 'tipo' aggiunta correttamente alla tabella societa_sponsors."]);
} catch (\Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo json_encode(['success' => true, 'message' => "La colonna 'tipo' esiste già."]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}
