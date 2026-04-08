<?php
require_once __DIR__ . '/api/Shared/TenantContext.php';
require_once __DIR__ . '/api/Shared/Database.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

try {
    // Manually read .env or rely on the env if already set
    if (file_exists(__DIR__ . '/.env')) {
        $lines = file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) continue;
            putenv($line);
            $parts = explode('=', $line, 2);
            if(count($parts)==2) {
                $_ENV[$parts[0]] = trim($parts[1], '"\' ');
            }
        }
    }

    $db = Database::getInstance();
    $stmt = $db->prepare('DESCRIBE attendances');
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "Attendances structure:\n";
    print_r($rows);

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
