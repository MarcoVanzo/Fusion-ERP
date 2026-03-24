<?php
$host   = '31.11.39.161';
$port   = '3306';
$dbname = 'Sql1804377_2';
$user   = 'Sql1804377';
$pass   = 'u3z4t994$@psAPr';

try {
    $db = new PDO("mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4", $user, $pass);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql1 = "ALTER TABLE staff_members ADD COLUMN id_doc_back_file_path VARCHAR(255) DEFAULT NULL";
    $sql2 = "ALTER TABLE staff_members ADD COLUMN cf_doc_back_file_path VARCHAR(255) DEFAULT NULL";
    
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

