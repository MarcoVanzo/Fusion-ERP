<?php
/**
 * import_athletes_sql.php — One-shot SQL import endpoint
 *
 * Reads uploads/import_remaining_athletes.sql and executes each statement
 * against the database.  Protected by a single-use token.
 *
 * Usage (from browser, once deployed):
 *   https://www.fusionteamvolley.it/ERP/import_athletes_sql.php?token=FUSION_IMPORT_2026
 *
 * IMPORTANT: Delete this file from the server after use.
 */

declare(strict_types=1);

// ─── Security: simple shared-secret token ────────────────────────────────────
$EXPECTED_TOKEN = 'FUSION_IMPORT_2026';

if (($_GET['token'] ?? '') !== $EXPECTED_TOKEN) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Forbidden – invalid token']);
    exit;
}

// ─── Load .env (same logic the app uses) ─────────────────────────────────────
$envFile = __DIR__ . '/.env';
if (is_readable($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#')
            continue;
        [$key, $value] = explode('=', $line, 2);
        $value = trim($value, '"\'');
        putenv("$key=$value");
    }
}

// ─── DB connection via PDO ───────────────────────────────────────────────────
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'fusion_erp';
$user = getenv('DB_USER') ?: '';
$pass = getenv('DB_PASS') ?: '';

$dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

header('Content-Type: text/plain; charset=utf-8');

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => true, // needed for multi-statement SET @var
    ]);
    echo "✅ Connected to DB ({$host}:{$port}/{$dbname})\n\n";
}
catch (PDOException $e) {
    echo "❌ DB connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// ─── Apply V006 migration if columns are missing ─────────────────────────────
echo "Checking V006 migration (athlete extra fields)...\n";
$v006Columns = [
    'residence_address' => 'VARCHAR(255) NULL',
    'identity_document' => 'VARCHAR(50) NULL',
    'fiscal_code' => 'VARCHAR(16) NULL',
    'registration_form_signed' => 'TINYINT(1) NULL',
    'shirt_size' => 'VARCHAR(10) NULL',
    'medical_cert_expires_at' => 'DATE NULL',
    'medical_cert_type' => 'VARCHAR(20) NULL',
    'privacy_consent_signed' => 'TINYINT(1) NULL',
    'federal_id' => 'VARCHAR(50) NULL',
    'shoe_size' => 'VARCHAR(10) NULL',
];

foreach ($v006Columns as $colName => $colDef) {
    $check = $pdo->prepare(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
        . "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'athletes' AND COLUMN_NAME = ?"
    );
    $check->execute([$dbname, $colName]);
    if ((int)$check->fetchColumn() === 0) {
        $pdo->exec("ALTER TABLE athletes ADD COLUMN `{$colName}` {$colDef}");
        echo "  ✅ Added column `{$colName}`\n";
    }
    else {
        echo "  ⏭️  Column `{$colName}` already exists\n";
    }
}
echo "\n";

// ─── Ensure required teams exist ─────────────────────────────────────────────
echo "Checking required teams...\n";
$requiredTeams = [
    ['TEAM_u13', 'Fusion U13', 'U13', '2025-26'],
    ['TEAM_u14', 'Fusion U14', 'U14', '2025-26'],
    ['TEAM_u16', 'Fusion U16', 'U16', '2025-26'],
    ['TEAM_u18', 'Fusion U18', 'U18', '2025-26'],
];

$teamStmt = $pdo->prepare(
    "INSERT IGNORE INTO teams (id, name, category, season, is_active) "
    . "VALUES (?, ?, ?, ?, 1)"
);

foreach ($requiredTeams as [$id, $name, $cat, $season]) {
    $check = $pdo->prepare("SELECT COUNT(*) FROM teams WHERE category = ? AND deleted_at IS NULL");
    $check->execute([$cat]);
    if ((int)$check->fetchColumn() > 0) {
        echo "  ⏭️  Team '{$cat}' already exists\n";
    }
    else {
        $teamStmt->execute([$id, $name, $cat, $season]);
        echo "  ✅ Created team '{$name}' (id={$id})\n";
    }
}
echo "\n";

// ─── Read and execute the SQL file ───────────────────────────────────────────
$sqlFile = __DIR__ . '/uploads/import_remaining_athletes.sql';

if (!is_readable($sqlFile)) {
    echo "❌ SQL file not found: {$sqlFile}\n";
    exit(1);
}

$sql = file_get_contents($sqlFile);
echo "📄 Loaded SQL file (" . strlen($sql) . " bytes)\n\n";

// Split on semicolons followed by newline
$rawChunks = preg_split('/;\s*\n/', $sql);

// For each chunk: strip comment lines, skip if nothing executable remains
$statements = [];
foreach ($rawChunks as $chunk) {
    $trimmed = trim($chunk);
    if ($trimmed === '')
        continue;
    // Strip comment-only lines to get the executable part
    $executable = trim(preg_replace('/^\s*--.*$/m', '', $trimmed));
    if ($executable !== '') {
        $statements[] = $trimmed; // keep original (with comments, for logging)
    }
}

echo "📋 Found " . count($statements) . " SQL statements\n\n";

$success = 0;
$errors = 0;

foreach ($statements as $i => $stmt) {
    $clean = trim(preg_replace('/^\s*--.*$/m', '', $stmt));
    if ($clean === '')
        continue;

    $num = $i + 1;
    try {
        $affected = $pdo->exec($stmt . ';');

        // Show meaningful info for INSERT statements
        if (stripos($clean, 'INSERT') !== false) {
            // Try to extract athlete name from a preceding comment
            if (preg_match("/-- .+?: (.+)$/m", $stmt, $m)) {
                echo '  ✅ [' . (string)$num . '] Inserted: ' . $m[1] . "\n";
            }
            else {
                echo '  ✅ [' . (string)$num . '] INSERT OK (rows affected: ' . (string)$affected . ")\n";
            }
        }
        else {
            echo '  ✅ [' . (string)$num . '] OK: ' . substr($clean, 0, 80) . "\n";
        }
        $success++;
    }
    catch (PDOException $e) {
        echo '  ❌ [' . (string)$num . '] ERROR: ' . $e->getMessage() . "\n";
        echo "      SQL: " . substr($clean, 0, 120) . "…\n";
        $errors++;
    }
}

echo "\n" . str_repeat('─', 60) . "\n";
echo '✅ Completed: ' . (string)$success . ' successful, ' . (string)$errors . " errors\n";

if ($errors === 0) {
    echo "\n🎉 All athletes imported successfully!\n";
    echo "⚠️  Remember to DELETE this file from the server for security.\n";
}