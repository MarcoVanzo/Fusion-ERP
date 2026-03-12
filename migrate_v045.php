<?php
require_once __DIR__ . '/vendor/autoload.php';

// Carica variabili d'ambiente manualmente
$envFile = __DIR__ . '/.env.prod';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0 || empty(trim($line))) continue;
        putenv(trim($line));
    }
}

try {
    $db = \FusionERP\Shared\Database::getInstance();
    
    // V045__federation_logos.sql
    $db->exec("ALTER TABLE federation_standings ADD COLUMN IF NOT EXISTS logo VARCHAR(300) NULL AFTER team");
    $db->exec("ALTER TABLE federation_matches ADD COLUMN IF NOT EXISTS home_logo VARCHAR(300) NULL AFTER home_team");
    $db->exec("ALTER TABLE federation_matches ADD COLUMN IF NOT EXISTS away_logo VARCHAR(300) NULL AFTER away_team");

    echo json_encode(["success" => true, "message" => "Migration V045 applied"]);

} catch (\Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
