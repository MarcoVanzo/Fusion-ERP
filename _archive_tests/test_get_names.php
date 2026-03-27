<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/Database.php';
Dotenv\Dotenv::createImmutable(__DIR__)->load();
$db = FusionERP\Shared\Database::getInstance();
$stmt1 = $db->query('SELECT nome_e_cognome FROM outseason_entries WHERE season_key = "2026"');
$entries = $stmt1->fetchAll(PDO::FETCH_ASSOC);
$stmt2 = $db->query('SELECT entry_name FROM outseason_verifications WHERE season_key = "2026"');
$verifs = $stmt2->fetchAll(PDO::FETCH_ASSOC);

echo "--- ENTRIES ---\n";
foreach($entries as $e) echo "'" . $e['nome_e_cognome'] . "'\n";
echo "--- VERIFS ---\n";
foreach($verifs as $v) echo "'" . $v['entry_name'] . "'\n";
