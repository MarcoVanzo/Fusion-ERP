<?php
/**
 * ONE-TIME MIGRATION SCRIPT — V041 tasks_enhancements
 * Aggiunge colonne: task_logs.esito, task_logs.attachment, tasks.attachment
 *
 * Run via browser: https://yourdomain.com/run_migration_v041.php?secret=fusionerp2025
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
    echo "✅ Connessione al database OK\n\n";
}
catch (PDOException $e) {
    die("❌ Connessione fallita: " . $e->getMessage() . "\n");
}

// ─── Verifica stato iniziale ──────────────────────────────────────────────────
echo "--- Stato colonne pre-migrazione ---\n";

$checks = [
    ['table' => 'task_logs', 'column' => 'esito'],
    ['table' => 'task_logs', 'column' => 'attachment'],
    ['table' => 'tasks', 'column' => 'attachment'],
];

foreach ($checks as $chk) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = :table
          AND COLUMN_NAME  = :col
    ");
    $stmt->execute([':table' => $chk['table'], ':col' => $chk['column']]);
    $exists = (int)$stmt->fetchColumn() > 0;
    echo ($exists ? "✅" : "❌") . " {$chk['table']}.{$chk['column']}: " . ($exists ? 'ESISTE GIÀ' : 'MANCANTE') . "\n";
}

echo "\n--- Applicazione V041 ---\n\n";

$sqlFile = __DIR__ . '/db/migrations/V041__tasks_enhancements.sql';
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
        echo "✅ OK: " . substr($stmt, 0, 100) . "...\n";
        $executed++;
    }
    catch (PDOException $e) {
        // Ignora errori "Duplicate column name" (idempotente)
        if (str_contains($e->getMessage(), 'Duplicate column')) {
            echo "ℹ️  SKIP (colonna già esiste): " . substr($stmt, 0, 60) . "\n";
            $skipped++;
        }
        else {
            echo "❌ ERRORE: " . $e->getMessage() . "\n   Statement: " . substr($stmt, 0, 100) . "\n";
            $errors++;
        }
    }
}

echo "\n--- Riepilogo ---\n";
echo "Eseguiti: {$executed}\nSaltati:  {$skipped}\nErrori:   {$errors}\n\n";

// ─── Verifica finale ──────────────────────────────────────────────────────────
echo "--- Verifica finale ---\n";
foreach ($checks as $chk) {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = :table
          AND COLUMN_NAME  = :col
    ");
    $stmt->execute([':table' => $chk['table'], ':col' => $chk['column']]);
    $ok = (int)$stmt->fetchColumn() > 0;
    echo ($ok ? "✅" : "❌") . " {$chk['table']}.{$chk['column']}: " . ($ok ? 'PRESENTE' : 'ANCORA MANCANTE') . "\n";
}

echo "\n⚠️  ELIMINA QUESTO FILE DAL SERVER DOPO AVER APPLICATO LA MIGRAZIONE!\n";
echo "   rm run_migration_v041.php\n";