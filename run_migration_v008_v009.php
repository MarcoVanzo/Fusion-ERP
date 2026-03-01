<?php
/**
 * run_migration_v008_v009.php — One-shot migration runner
 * Executes V008 (athlete registry fields) and V009 (populate phone from parent_phone)
 *
 * Usage:
 *   https://www.fusionteamvolley.it/ERP/run_migration_v008_v009.php?token=FUSION_MIGRATE_V008
 *
 * IMPORTANT: Delete this file from the server after use.
 */

declare(strict_types=1);

$EXPECTED_TOKEN = 'FUSION_MIGRATE_V008';

if (($_GET['token'] ?? '') !== $EXPECTED_TOKEN) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Forbidden – invalid token']);
    exit;
}

// Load .env
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

// DB connection
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
        PDO::ATTR_EMULATE_PREPARES => true,
    ]);
    echo "✅ Connected to DB ({$host}:{$port}/{$dbname})\n\n";
}
catch (PDOException $e) {
    echo "❌ DB connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Helper: check if column exists
function columnExists(PDO $pdo, string $dbname, string $column): bool
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'athletes' AND COLUMN_NAME = ?"
    );
    $stmt->execute([$dbname, $column]);
    return (int)$stmt->fetchColumn() > 0;
}

// Helper: check if index exists
function indexExists(PDO $pdo, string $dbname, string $indexName): bool
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'athletes' AND INDEX_NAME = ?"
    );
    $stmt->execute([$dbname, $indexName]);
    return (int)$stmt->fetchColumn() > 0;
}

$errors = 0;
$success = 0;

// ═══════════════════════════════════════════════════════════════════════════════
echo "══════ V008: Athlete Registry Fields ══════\n\n";

// Step 1: Add new columns
$v008Columns = [
    'first_name' => ['def' => 'VARCHAR(80) NULL', 'after' => 'full_name'],
    'last_name' => ['def' => 'VARCHAR(80) NULL', 'after' => 'first_name'],
    'birth_place' => ['def' => 'VARCHAR(150) NULL', 'after' => 'birth_date'],
    'residence_city' => ['def' => 'VARCHAR(100) NULL', 'after' => 'residence_address'],
    'phone' => ['def' => 'VARCHAR(30) NULL', 'after' => 'parent_phone'],
    'email' => ['def' => 'VARCHAR(150) NULL', 'after' => 'phone'],
];

foreach ($v008Columns as $colName => $info) {
    if (columnExists($pdo, $dbname, $colName)) {
        echo "  ⏭️  Column `{$colName}` already exists\n";
        $success++;
    }
    else {
        try {
            $pdo->exec("ALTER TABLE athletes ADD COLUMN `{$colName}` {$info['def']} AFTER `{$info['after']}`");
            echo "  ✅ Added column `{$colName}`\n";
            $success++;
        }
        catch (PDOException $e) {
            echo "  ❌ Error adding `{$colName}`: " . $e->getMessage() . "\n";
            $errors++;
        }
    }
}

// Step 2: Populate first_name / last_name from full_name
echo "\n  Populating first_name/last_name from full_name...\n";
try {
    $affected = $pdo->exec(
        "UPDATE athletes SET 
            first_name = SUBSTRING_INDEX(full_name, ' ', 1),
            last_name  = TRIM(SUBSTRING(full_name FROM LOCATE(' ', full_name) + 1))
         WHERE full_name IS NOT NULL AND (first_name IS NULL OR first_name = '')"
    );
    $affected = (int)$affected;
    echo "  ✅ Populated " . (string)$affected . " athletes\n";
    $success++;
}
catch (PDOException $e) {
    echo "  ❌ Error populating names: " . $e->getMessage() . "\n";
    $errors++;
}

// Step 3: Convert full_name to GENERATED column
echo "\n  Converting full_name to GENERATED column...\n";
try {
    // Check if full_name is already a generated column
    $stmt = $pdo->prepare(
        "SELECT GENERATION_EXPRESSION FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'athletes' AND COLUMN_NAME = 'full_name'"
    );
    $stmt->execute([$dbname]);
    $genExpr = $stmt->fetchColumn();

    if (!empty($genExpr)) {
        echo "  ⏭️  full_name is already a GENERATED column\n";
        $success++;
    }
    else {
        $pdo->exec("ALTER TABLE athletes DROP COLUMN full_name");
        $pdo->exec(
            "ALTER TABLE athletes ADD COLUMN full_name VARCHAR(150) 
             GENERATED ALWAYS AS (CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,''))) STORED 
             AFTER last_name"
        );
        echo "  ✅ full_name converted to GENERATED column\n";
        $success++;
    }
}
catch (PDOException $e) {
    echo "  ❌ Error converting full_name: " . $e->getMessage() . "\n";
    $errors++;
}

// Step 4: Add indexes
echo "\n  Adding indexes...\n";
if (!indexExists($pdo, $dbname, 'idx_athletes_fiscal_code')) {
    try {
        $pdo->exec("ALTER TABLE athletes ADD INDEX idx_athletes_fiscal_code (fiscal_code)");
        echo "  ✅ Index idx_athletes_fiscal_code added\n";
        $success++;
    }
    catch (PDOException $e) {
        echo "  ⚠️  Index fiscal_code: " . $e->getMessage() . "\n";
    }
}
else {
    echo "  ⏭️  Index idx_athletes_fiscal_code already exists\n";
    $success++;
}

if (!indexExists($pdo, $dbname, 'idx_athletes_email')) {
    try {
        $pdo->exec("ALTER TABLE athletes ADD INDEX idx_athletes_email (email)");
        echo "  ✅ Index idx_athletes_email added\n";
        $success++;
    }
    catch (PDOException $e) {
        echo "  ⚠️  Index email: " . $e->getMessage() . "\n";
    }
}
else {
    echo "  ⏭️  Index idx_athletes_email already exists\n";
    $success++;
}

// ═══════════════════════════════════════════════════════════════════════════════
echo "\n══════ V009: Populate phone from parent_phone ══════\n\n";

try {
    $affected = $pdo->exec(
        "UPDATE athletes SET phone = parent_phone 
         WHERE parent_phone IS NOT NULL AND phone IS NULL AND deleted_at IS NULL"
    );
    $affected = (int)$affected;
    echo "  ✅ Copied parent_phone → phone for " . (string)$affected . " athletes\n";
    $success++;
}
catch (PDOException $e) {
    echo "  ❌ Error: " . $e->getMessage() . "\n";
    $errors++;
}

// ═══════════════════════════════════════════════════════════════════════════════
echo "\n══════ Verifica finale ══════\n\n";

try {
    $stmt = $pdo->query(
        "SELECT id, first_name, last_name, full_name, phone, email, birth_place, residence_city 
         FROM athletes WHERE deleted_at IS NULL ORDER BY full_name LIMIT 10"
    );
    $rows = $stmt->fetchAll();

    echo "  Primi 10 atleti:\n";
    foreach ($rows as $r) {
        echo "    {$r['id']} | {$r['first_name']} {$r['last_name']} | phone:{$r['phone']} | email:{$r['email']}\n";
    }
}
catch (PDOException $e) {
    echo "  ❌ Verifica fallita: " . $e->getMessage() . "\n";
    $errors++;
}

echo "\n" . str_repeat('─', 60) . "\n";
echo "✅ Completato: " . (string)$success . " ok, " . (string)$errors . " errori\n";

if ($errors === 0) {
    echo "\n🎉 Migrations V008 + V009 eseguite con successo!\n";
    echo "⚠️  Ricordati di ELIMINARE questo file dal server per sicurezza.\n";
}