<?php
/**
 * ONE-TIME MIGRATION SCRIPT — V039 contacts table
 * Run via browser: https://www.fusionteamvolley.it/ERP/api/run_migration_v039.php?secret=fusionerp2025
 *
 * DELETE THIS FILE AFTER RUNNING IT ONCE.
 */

declare(strict_types=1);

if (($_GET['secret'] ?? '') !== 'fusionerp2025') {
    http_response_code(403);
    die('403 Forbidden — pass ?secret=fusionerp2025 to run this migration.');
}

require_once __DIR__ . '/../vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__));
$dotenv->load();

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = new PDO(
        'mysql:host=' . getenv('DB_HOST') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4',
        getenv('DB_USER'),
        getenv('DB_PASS'),
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
        );
    echo "✅ Connessione al database OK\n\n";
}
catch (PDOException $e) {
    die("❌ Connessione fallita: " . $e->getMessage() . "\n");
}

// Check if contacts table already exists
$rows = $pdo->query("SHOW TABLES LIKE 'contacts'")->fetchAll();
$exists = count($rows) > 0;
echo ($exists ? "✅" : "❌") . " contacts: " . ($exists ? 'ESISTE GIÀ' : 'MANCANTE') . "\n\n";

echo "--- Applicazione V039 ---\n\n";

$sqlFile = __DIR__ . '/../db/migrations/V039__contacts.sql';
if (!file_exists($sqlFile)) {
    die("❌ File SQL non trovato: {$sqlFile}\n");
}

$sql = file_get_contents($sqlFile);
$statements = array_filter(array_map('trim', explode(';', $sql)));

$errors = 0;
$skipped = 0;
$executed = 0;

foreach ($statements as $stmt) {
    if (empty($stmt) || str_starts_with(ltrim($stmt), '--')) {
        $skipped++;
        continue;
    }
    try {
        $pdo->exec($stmt);
        echo "✅ OK: " . substr($stmt, 0, 80) . "...\n";
        $executed++;
    }
    catch (PDOException $e) {
        if (str_contains($e->getMessage(), 'already exists')) {
            echo "ℹ️  SKIP (già esiste): " . substr($stmt, 0, 60) . "\n";
            $skipped++;
        }
        else {
            echo "❌ ERRORE: " . $e->getMessage() . "\n   Statement: " . substr($stmt, 0, 80) . "\n";
            $errors++;
        }
    }
}

echo "\n--- Riepilogo ---\n";
echo "Eseguiti: {$executed}\nSaltati:  {$skipped}\nErrori:   {$errors}\n\n";

echo "--- Verifica finale ---\n";
$rows = $pdo->query("SHOW TABLES LIKE 'contacts'")->fetchAll();
$ok = count($rows) > 0;
echo ($ok ? "✅" : "❌") . " contacts: " . ($ok ? 'CREATA CON SUCCESSO' : 'ANCORA MANCANTE') . "\n";

if ($ok) {
    // Mostra colonne
    $cols = $pdo->query("DESCRIBE contacts")->fetchAll(PDO::FETCH_ASSOC);
    echo "\nColonne:\n";
    foreach ($cols as $col) {
        echo "  • {$col['Field']} ({$col['Type']})\n";
    }
}

echo "\n⚠️  ELIMINA QUESTO FILE DAL SERVER DOPO AVER APPLICATO LA MIGRAZIONE!\n";
echo "   rm api/run_migration_v039.php\n";