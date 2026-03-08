<?php
require 'api/Shared/Database.php';

try {
    // Parse .env
    if (file_exists('.env')) {
        $lines = file('.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0)
                continue;
            list($name, $value) = explode('=', $line, 2);
            putenv(trim($name) . '=' . trim($value));
        }
    }

    $pdo = \FusionERP\Shared\Database::getInstance();
    $stmt = $pdo->query("DESCRIBE federation_matches");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    print_r($columns);

    // Also check logs
    echo "\n\n--- TAIL OF ERROR LOG ---\n";
    if (file_exists('php_errors.log')) {
        system('tail -n 20 php_errors.log');
    }
}
catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}