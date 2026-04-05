<?php
require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../api/Shared/MigrationRunner.php';

use FusionERP\Shared\MigrationRunner;

try {
    $db = new PDO('sqlite::memory:');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Some MySQL syntax isn't supported in SQLite, so let's see if sqlite works
    // Actually sqlite will fail on ENUM, ENGINE=InnoDB, etc.
    // Let's just create a mock string parsing for all V*.sql files
    $migrationsDir = __DIR__ . '/../db/migrations';
    $files = glob($migrationsDir . '/V*__*.sql');
    sort($files);
    
    $tables = [];
    foreach($files as $file) {
        $content = file_get_contents($file);
        // Simple regex to extract CREATE TABLE definition or ALTER TABLE
        preg_match_all('/CREATE TABLE (?:IF NOT EXISTS )?`?(\w+)`?\s*\((.*?)\)\s*(?:ENGINE|;)/is', $content, $matches, PREG_SET_ORDER);
        foreach($matches as $m) {
            $tableName = $m[1];
            $tables[$tableName] = $m[2]; // we just grab the body
        }
        
        // This is a rough approximation.
    }
    
    file_put_contents(__DIR__ . '/../tmp/schema_dump.json', json_encode(array_keys($tables), JSON_PRETTY_PRINT));
    echo "Trovate " . count($tables) . " tabelle. Salvate in tmp/schema_dump.json\n";
    
} catch (Exception $e) {
    echo "Errore: " . $e->getMessage() . "\n";
}
