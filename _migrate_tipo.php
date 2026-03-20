<?php
require_once __DIR__ . '/api/Shared/Database.php';
try {
    $db = \FusionERP\Shared\Database::getInstance();
    $db->exec("ALTER TABLE societa_sponsors ADD COLUMN tipo VARCHAR(50) DEFAULT 'Sponsor' AFTER name;");
    echo "Colonna 'tipo' aggiunta correttamente alla tabella societa_sponsors.\n";
} catch (\Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "La colonna 'tipo' esiste già.\n";
    } else {
        echo "Errore: " . $e->getMessage() . "\n";
    }
}
