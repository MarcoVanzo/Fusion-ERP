<?php
/**
 * V066 Migration: Add athlete document columns
 * Run via browser: /ERP/api/migrate_v066.php
 * DELETE THIS FILE AFTER RUNNING!
 */
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/Shared/Database.php';

try {
    $db = \FusionERP\Shared\Database::getInstance();
    
    $columns = [
        'contract_file_path',
        'id_doc_front_file_path',
        'id_doc_back_file_path',
        'cf_doc_front_file_path',
        'cf_doc_back_file_path',
        'medical_cert_file_path'
    ];
    
    $added = [];
    $skipped = [];
    
    foreach ($columns as $col) {
        // Check if column already exists
        $check = $db->query("SHOW COLUMNS FROM athletes LIKE '$col'");
        if ($check->rowCount() > 0) {
            $skipped[] = $col;
            continue;
        }
        
        $db->exec("ALTER TABLE athletes ADD COLUMN $col VARCHAR(500) DEFAULT NULL");
        $added[] = $col;
    }
    
    echo "<h2>V066 Migration: Athlete Documents</h2>";
    echo "<p style='color:green;font-weight:bold;'>✅ Migration completed successfully!</p>";
    
    if ($added) {
        echo "<p><strong>Added columns:</strong> " . implode(', ', $added) . "</p>";
    }
    if ($skipped) {
        echo "<p><strong>Already existed (skipped):</strong> " . implode(', ', $skipped) . "</p>";
    }
    
    echo "<p style='color:red;'>⚠️ REMEMBER: Delete this file from the server after running!</p>";
    
} catch (Exception $e) {
    echo "<h2>❌ Migration Error</h2>";
    echo "<p>" . htmlspecialchars($e->getMessage()) . "</p>";
}
