<?php
require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

try {
    $db = \FusionERP\Shared\Database::getInstance();
    
    try {
        $db->exec("ALTER TABLE federation_standings ADD COLUMN logo VARCHAR(300) NULL AFTER team");
    } catch (\Exception $e) {}
    
    try {
        $db->exec("ALTER TABLE federation_matches ADD COLUMN home_logo VARCHAR(300) NULL AFTER home_team");
    } catch (\Exception $e) {}
    
    try {
        $db->exec("ALTER TABLE federation_matches ADD COLUMN away_logo VARCHAR(300) NULL AFTER away_team");
    } catch (\Exception $e) {}

    echo json_encode(["success" => true, "message" => "Migration V045 applied"]);

} catch (\Exception $e) {
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
