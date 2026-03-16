<?php
// Script to compare DB schema with Repository UPDATE queries
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

$db = FusionERP\Shared\Database::getInstance();

$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$schema = [];
foreach ($tables as $table) {
    $columns = $db->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_COLUMN);
    $schema[$table] = $columns;
}

$repoDir = __DIR__ . '/api/Modules';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($repoDir));

foreach ($iterator as $file) {
    if ($file->isFile() && str_ends_with($file->getFilename(), 'Repository.php')) {
        $content = file_get_contents($file->getPathname());
        
        // Find all UPDATE queries
        if (preg_match_all("/UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+(.*?)\s+WHERE/is", $content, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $match) {
                $table = $match[1];
                $setClause = $match[2];
                
                if (isset($schema[$table])) {
                    // Extract columns being updated
                    preg_match_all("/([a-zA-Z0-9_]+)\s*=/is", $setClause, $colMatches);
                    $updatedCols = array_map('strtolower', $colMatches[1]);
                    $tableCols = array_map('strtolower', $schema[$table]);
                    
                    // Fields not in UPDATE
                    $missing = array_diff($tableCols, $updatedCols);
                    // Filter out common fields like id, created_at, updated_at, deleted_at, tenant_id
                    $ignored = ['id', 'created_at', 'updated_at', 'deleted_at', 'tenant_id', 'is_deleted'];
                    $missing = array_diff($missing, $ignored);
                    
                    if (!empty($missing)) {
                        echo "File: " . $file->getFilename() . " | Table: $table\n";
                        echo "  Missing cols in UPDATE: " . implode(', ', $missing) . "\n\n";
                    }
                }
            }
        }
    }
}
echo "Done.\n";
