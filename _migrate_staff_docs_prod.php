<?php
require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance()->getConnection();
    $sql1 = "ALTER TABLE staff_members ADD COLUMN id_doc_back_file_path VARCHAR(255) DEFAULT NULL";
    $sql2 = "ALTER TABLE staff_members ADD COLUMN cf_doc_back_file_path VARCHAR(255) DEFAULT NULL";
    
    // Ignore errors if columns already exist
    try {
        $db->exec($sql1);
        echo "Colonna id_doc_back_file_path aggiunta con successo.<br>";
    } catch (PDOException $e) {
        if ($e->getCode() === '42S21') {
            echo "Colonna id_doc_back_file_path già esistente.<br>";
        } else {
            throw $e;
        }
    }
    
    try {
        $db->exec($sql2);
        echo "Colonna cf_doc_back_file_path aggiunta con successo.<br>";
    } catch (PDOException $e) {
        if ($e->getCode() === '42S21') {
            echo "Colonna cf_doc_back_file_path già esistente.<br>";
        } else {
            throw $e;
        }
    }
    
    echo "<br><b>Migrazione completata con successo!</b>";
} catch (Exception $e) {
    echo "Errore durante la migrazione: " . $e->getMessage();
}
