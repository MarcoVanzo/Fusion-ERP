<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/Database.php';
Dotenv\Dotenv::createImmutable(__DIR__)->load();
$db = FusionERP\Shared\Database::getInstance();
$stmt = $db->query('SELECT nome_e_cognome FROM outseason_entries WHERE season_key = "2026"');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $row) {
    if (trim($row['nome_e_cognome']) !== $row['nome_e_cognome']) {
        echo "TRIM MISMATCH: '" . $row['nome_e_cognome'] . "'\n";
    }
}
echo "Done.\n";
