<?php
/**
 * import_cartel1.php — One-shot import atleti da Cartel1.xlsx
 *
 * Esegue uploads/import_cartel1_athletes.sql contro il DB.
 * Protetto da token. ELIMINARE dopo l'uso.
 *
 * URL: https://www.fusionteamvolley.it/ERP/import_cartel1.php?token=fsnImP0rt_2526_xK9q
 */

declare(strict_types=1);

// ─── Security ─────────────────────────────────────────────────────────────────
$envFile = __DIR__ . '/.env';
$env = [];
if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#')
            continue;
        [$k, $v] = explode('=', $line, 2);
        $env[trim($k)] = trim($v, "\"'");
    }
}

$expectedToken = $env['IMPORT_SECRET'] ?? 'fsnImP0rt_2526_xK9q';
if (($_GET['token'] ?? '') !== $expectedToken) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

header('Content-Type: text/plain; charset=utf-8');

// ─── DB connection ─────────────────────────────────────────────────────────────
$host = $env['DB_HOST'] ?? '127.0.0.1';
$port = $env['DB_PORT'] ?? '3306';
$dbname = $env['DB_NAME'] ?? '';
$user = $env['DB_USER'] ?? '';
$pass = $env['DB_PASS'] ?? '';

try {
    $pdo = new PDO(
        "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4",
        $user, $pass,
    [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => true,
    ]
        );
    echo "✅ DB connesso ({$host}/{$dbname})\n\n";
}
catch (PDOException $e) {
    echo "❌ Connessione fallita: " . $e->getMessage() . "\n";
    exit(1);
}

// ─── Verifica colonne V008 (first_name, last_name, birth_place, etc.) ──────────
echo "🔍 Verifica colonne anagrafica completa...\n";
$v008Cols = [
    'first_name' => 'VARCHAR(80) NULL',
    'last_name' => 'VARCHAR(80) NULL',
    'birth_place' => 'VARCHAR(150) NULL',
    'residence_city' => 'VARCHAR(100) NULL',
    'phone' => 'VARCHAR(30) NULL',
    'email' => 'VARCHAR(150) NULL',
];

$stmtCols = $pdo->prepare(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME='athletes'"
);
$stmtCols->execute([$dbname]);
$existingCols = array_column($stmtCols->fetchAll(), 'COLUMN_NAME');

foreach ($v008Cols as $col => $def) {
    if (!in_array($col, $existingCols)) {
        $pdo->exec("ALTER TABLE athletes ADD COLUMN `{$col}` {$def}");
        echo "  ✅ Aggiunta colonna: {$col}\n";
    }
    else {
        echo "  ⏭️  Colonna {$col} già presente\n";
    }
}
echo "\n";

// ─── Carica e split SQL ────────────────────────────────────────────────────────
$sqlFile = __DIR__ . '/uploads/import_cartel1_athletes.sql';
if (!is_readable($sqlFile)) {
    echo "❌ File SQL non trovato: {$sqlFile}\n";
    exit(1);
}

$sql = file_get_contents($sqlFile);
echo "📄 File SQL caricato (" . strlen($sql) . " bytes)\n\n";

$chunks = preg_split('/;\s*\n/', $sql);
$statements = [];
foreach ($chunks as $chunk) {
    $clean = trim(preg_replace('/^\s*--.*$/m', '', $chunk));
    if ($clean !== '') {
        $statements[] = $chunk;
    }
}

echo "📋 " . count($statements) . " statement trovati\n\n";

// ─── Esegui ───────────────────────────────────────────────────────────────────
$success = 0;
$errors = 0;

foreach ($statements as $i => $stmt) {
    $clean = trim(preg_replace('/^\s*--.*$/m', '', $stmt));
    if ($clean === '')
        continue;

    $num = $i + 1;
    try {
        $pdo->exec($stmt . ';');

        // Estrae nome dal commento
        if (preg_match('/^--\s+(.+)$/m', $stmt, $m)) {
            $label = trim($m[1]);
        }
        else {
            $label = substr($clean, 0, 60);
        }

        $icon = (stripos($clean, 'INSERT') !== false) ? '✅' : '⚙️';
        echo "  {$icon} [{$num}] {$label}\n";
        $success++;
    }
    catch (PDOException $e) {
        echo "  ❌ [{$num}] ERRORE: " . $e->getMessage() . "\n";
        echo "     SQL: " . substr($clean, 0, 100) . "…\n";
        $errors++;
    }
}

echo "\n" . str_repeat('─', 60) . "\n";
echo "✅ Successo: {$success}   ❌ Errori: {$errors}\n";

if ($errors === 0) {
    echo "\n🎉 Tutti gli atleti importati con successo!\n";
    echo "⚠️  IMPORTANTE: Elimina questo file dal server dopo l'uso.\n";
}
else {
    echo "\n⚠️  Importazione completata con {$errors} errori.\n";
}