<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createMutable(dirname(__DIR__));
$dotenv->safeLoad();

require_once __DIR__ . '/Shared/Database.php';

use FusionERP\Shared\Database;

try {
    $db = Database::getInstance();

    $queries = [
        "ALTER TABLE scouting_athletes ADD COLUMN sit_and_reach DECIMAL(5,2) NULL AFTER peso",
        "ALTER TABLE scouting_athletes ADD COLUMN reach_2 DECIMAL(5,2) NULL AFTER reach_cm",
        "ALTER TABLE talent_day_entries ADD COLUMN sit_and_reach DECIMAL(5,2) NULL AFTER peso",
        "ALTER TABLE talent_day_entries ADD COLUMN reach_2 DECIMAL(5,2) NULL AFTER reach_cm"
    ];

    $successCount = 0;
    $errors = [];

    foreach ($queries as $sql) {
        try {
            $db->exec($sql);
            $successCount++;
        } catch (\PDOException $e) {
            // Se la colonna esiste già, ignoriamo l'errore (di solito codice 42S21 - Duplicate column name)
            if ($e->getCode() == '42S21') {
                $successCount++;
            } else {
                $errors[] = "Errore: " . $e->getMessage();
            }
        }
    }

    if (empty($errors)) {
        echo json_encode(["success" => true, "message" => "Migrazione completata con successo"]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "errors" => $errors]);
    }
} catch (\Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "error" => $e->getMessage()]);
}
