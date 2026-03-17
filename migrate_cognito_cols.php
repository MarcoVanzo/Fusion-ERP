<?php
/**
 * Standalone migration — Add cognito columns to scouting_athletes
 * DELETE THIS FILE AFTER USE.
 */
ini_set('display_errors', 1);
error_reporting(E_ALL);

function loadEnvFile($path) {
    if (!file_exists($path)) return false;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    $vars = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        $eqPos = strpos($line, '=');
        if ($eqPos === false) continue;
        $vars[trim(substr($line, 0, $eqPos))] = trim(substr($line, $eqPos + 1));
    }
    return $vars;
}

$env = loadEnvFile(__DIR__ . '/.env');
if ($env === false) die("ERROR: .env not found\n");

try {
    $dsn = "mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname={$env['DB_NAME']};charset=utf8mb4";
    $pdo = new PDO($dsn, $env['DB_USER'], $env['DB_PASS'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Check if columns already exist
    $cols = $pdo->query("SHOW COLUMNS FROM scouting_athletes")->fetchAll(PDO::FETCH_COLUMN);
    
    if (in_array('cognito_id', $cols)) {
        echo "SKIP: cognito_id column already exists.\n";
    } else {
        $pdo->exec("ALTER TABLE scouting_athletes ADD COLUMN cognito_id INT NULL AFTER id");
        echo "OK: Added cognito_id\n";
    }
    
    if (in_array('cognito_form', $cols)) {
        echo "SKIP: cognito_form column already exists.\n";
    } else {
        $pdo->exec("ALTER TABLE scouting_athletes ADD COLUMN cognito_form VARCHAR(50) NULL AFTER cognito_id");
        echo "OK: Added cognito_form\n";
    }
    
    if (in_array('synced_at', $cols)) {
        echo "SKIP: synced_at column already exists.\n";
    } else {
        $pdo->exec("ALTER TABLE scouting_athletes ADD COLUMN synced_at TIMESTAMP NULL AFTER created_at");
        echo "OK: Added synced_at\n";
    }
    
    // Add unique key (ignore if exists)
    try {
        $pdo->exec("ALTER TABLE scouting_athletes ADD UNIQUE KEY uq_cognito (cognito_id, cognito_form)");
        echo "OK: Added unique key uq_cognito\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') !== false) {
            echo "SKIP: Unique key uq_cognito already exists.\n";
        } else {
            throw $e;
        }
    }
    
    echo "SUCCESS: Migration complete.\n";
} catch (PDOException $e) {
    echo "PDO ERROR: " . $e->getMessage() . "\n";
}
