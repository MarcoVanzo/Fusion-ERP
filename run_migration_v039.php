<?php
/**
 * ONE-TIME MIGRATION SCRIPT — V039 contacts table
 * Run via browser: https://www.fusionteamvolley.it/ERP/run_migration_v039.php?secret=fusionerp2025
 *
 * DELETE THIS FILE AFTER RUNNING IT ONCE.
 */

declare(strict_types=1);

if (($_GET['secret'] ?? '') !== 'fusionerp2025') {
    http_response_code(403);
    die('403 Forbidden — pass ?secret=fusionerp2025 to run this migration.');
}

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->load();

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4',
        getenv('DB_USER'),
        getenv('DB_PASS'),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "OK Connessione al database OK\n\n";
} catch (PDOException $e) {
    die("ERRORE Connessione fallita: " . $e->getMessage() . "\n");
}

$rows   = $pdo->query("SHOW TABLES LIKE 'contacts'")->fetchAll();
$exists = count($rows) > 0;
echo ($exists ? "GIA ESISTE" : "MANCANTE") . " contacts\n\n";

echo "--- Applicazione V039 ---\n\n";

$sqlFile = __DIR__ . '/db/migrations/V039__contacts.sql';
if (!file_exists($sqlFile)) {
    die("ERRORE File SQL non trovato\n");
}

// Leggi il file SQL, rimuovi le righe di commento e splitta per ';'
$rawSql   = file_get_contents($sqlFile);
$lines    = explode("\n", $rawSql);
$cleaned  = [];
foreach ($lines as $line) {
    $t = trim($line);
    if ($t === '' || strpos($t, '--') === 0) continue;
    $cleaned[] = $line;
}
$cleanSql   = implode("\n", $cleaned);
$statements = array_filter(array_map('trim', explode(';', $cleanSql)));

$errors = $skipped = $executed = 0;

foreach ($statements as $stmt) {
    if (empty($stmt)) {
        $skipped++;
        continue;
    }
    try {
        $pdo->exec($stmt);
        echo "OK: " . substr($stmt, 0, 80) . "...\n";
        $executed++;
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'already exists') !== false) {
            echo "SKIP (gia esiste): " . substr($stmt, 0, 60) . "\n";
            $skipped++;
        } else {
            echo "ERRORE: " . $e->getMessage() . "\n   -> " . substr($stmt, 0, 80) . "\n";
            $errors++;
        }
    }
}

echo "\n--- Riepilogo ---\n";
echo "Eseguiti: {$executed}\n";
echo "Saltati:  {$skipped}\n";
echo "Errori:   {$errors}\n\n";

echo "--- Verifica finale ---\n";
$rows = $pdo->query("SHOW TABLES LIKE 'contacts'")->fetchAll();
$ok   = count($rows) > 0;
echo ($ok ? "SUCCESSO" : "FALLITO") . " contacts: " . ($ok ? 'CREATA' : 'ANCORA MANCANTE') . "\n";

if ($ok) {
    $cols = $pdo->query("DESCRIBE contacts")->fetchAll(PDO::FETCH_ASSOC);
    echo "\nColonne:\n";
    foreach ($cols as $col) {
        echo "  - " . $col['Field'] . " (" . $col['Type'] . ")\n";
    }
}

echo "\nELIMINA QUESTO FILE DAL SERVER DOPO L'USO!\n";