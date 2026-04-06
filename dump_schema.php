<?php
/**
 * Schema Dump Script — Extracts all table and column metadata
 */

declare(strict_types=1);

// Standard PDO connection using .env
function getDb() {
    $env = [];
    $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $env[trim($key)] = trim($value, "\" \t");
        }
    }
    
    $dsn = "mysql:host={$env['DB_HOST']};port={$env['DB_PORT']};dbname={$env['DB_NAME']};charset=utf8mb4";
    return new PDO($dsn, $env['DB_USER'], $env['DB_PASS'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
}

try {
    $db = getDb();
    $tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $schema = [];
    foreach ($tables as $table) {
        $schema[$table] = $db->query("DESCRIBE `$table`")->fetchAll();
    }
    file_put_contents(__DIR__ . '/tmp/current_schema.json', json_encode($schema, JSON_PRETTY_PRINT));
    echo "Schema saved to tmp/current_schema.json\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
