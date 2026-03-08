<?php
/**
 * ONE-TIME MIGRATION SCRIPT — V041 tasks_enhancements
 * Compatibile con MySQL 5.7+ (senza IF NOT EXISTS nelle ALTER TABLE)
 *
 * Run via browser: https://domain.it/ERP/run_migration_v041.php?secret=fusionerp2025
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
    echo "✅ Connessione al DB OK — " . getenv('DB_NAME') . "\n\n";
} catch (PDOException $e) {
    die("❌ Connessione fallita: " . $e->getMessage() . "\n");
}

/**
 * Controlla se una colonna esiste nella tabella.
 */
function columnExists(PDO $pdo, string $table, string $col): bool {
    $stmt = $pdo->prepare("
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = :table
          AND COLUMN_NAME  = :col
    ");
    $stmt->execute([':table' => $table, ':col' => $col]);
    return (int)$stmt->fetchColumn() > 0;
}

/**
 * Esegue una ALTER TABLE solo se la colonna NON esiste già.
 */
function addColumnIfMissing(PDO $pdo, string $table, string $col, string $definition, string $after = ''): void {
    if (columnExists($pdo, $table, $col)) {
        echo "ℹ️  SKIP: {$table}.{$col} esiste già\n";
        return;
    }
    $afterClause = $after ? " AFTER `{$after}`" : '';
    $sql = "ALTER TABLE `{$table}` ADD COLUMN `{$col}` {$definition}{$afterClause}";
    try {
        $pdo->exec($sql);
        echo "✅ AGGIUNTA: {$table}.{$col}\n";
    } catch (PDOException $e) {
        echo "❌ ERRORE su {$table}.{$col}: " . $e->getMessage() . "\n";
    }
}

echo "--- Applicazione V041 ---\n\n";

// task_logs — esito (VARCHAR 50)
addColumnIfMissing(
    $pdo,
    'task_logs',
    'esito',
    "VARCHAR(50) DEFAULT NULL COMMENT 'Non ha risposto | Interessato | Richiamare | Confermato | Non interessato | In attesa | Altro'",
    'outcome'
);

// task_logs — attachment (LONGTEXT)
addColumnIfMissing(
    $pdo,
    'task_logs',
    'attachment',
    "LONGTEXT DEFAULT NULL COMMENT 'File allegato in formato base64 data-URI'",
    'esito'
);

// tasks — attachment (LONGTEXT)
addColumnIfMissing(
    $pdo,
    'tasks',
    'attachment',
    "LONGTEXT DEFAULT NULL COMMENT 'File allegato in formato base64 data-URI'",
    'notes'
);

// ─── Verifica finale ──────────────────────────────────────────────────────────
echo "\n--- Verifica finale ---\n";
$cols = [
    ['task_logs', 'esito'],
    ['task_logs', 'attachment'],
    ['tasks',     'attachment'],
];
$allOk = true;
foreach ($cols as [$table, $col]) {
    $ok = columnExists($pdo, $table, $col);
    echo ($ok ? "✅" : "❌") . " {$table}.{$col}: " . ($ok ? 'PRESENTE' : 'MANCANTE') . "\n";
    if (!$ok) $allOk = false;
}

echo "\n";
if ($allOk) {
    echo "🎉 Migrazione V041 completata con successo!\n";
} else {
    echo "⚠️  Alcune colonne non sono state create. Controlla gli errori sopra.\n";
}
echo "\n⚠️  ELIMINA QUESTO FILE DAL SERVER:\n   rm ERP/run_migration_v041.php\n";