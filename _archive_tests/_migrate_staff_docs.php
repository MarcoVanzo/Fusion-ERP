<?php
require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();
    
    // Add the retro fields
    $sql = "ALTER TABLE staff_members 
            ADD COLUMN id_doc_back_file_path varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER id_doc_file_path,
            ADD COLUMN cf_doc_back_file_path varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER cf_doc_file_path;";
            
    $db->exec($sql);
    echo "Migration completed successfully: added id_doc_back_file_path and cf_doc_back_file_path columns.\\n";
} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage() . "\\n";
}
