<?php
/**
 * run_migration_meta_tokens.php — One-shot migration runner
 * Creates the meta_tokens table for Meta Business API integration
 *
 * Usage:
 *   https://www.fusionteamvolley.it/ERP/run_migration_meta_tokens.php?token=FUSION_META_2526
 *
 * IMPORTANT: Delete this file from the server after use.
 */

declare(strict_types=1);

$EXPECTED_TOKEN = 'FUSION_META_2526';

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

// ═══════════════════════════════════════════════════════════════════════════════
echo "══════ Meta Tokens Table ══════\n\n";

// Check if table already exists
$stmt = $pdo->prepare(
    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'meta_tokens'"
);
$stmt->execute([$dbname]);
$tableExists = (int)$stmt->fetchColumn() > 0;

if ($tableExists) {
    echo "  ⏭️  Table `meta_tokens` already exists\n";
}
else {
    try {
        $pdo->exec("
            CREATE TABLE meta_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                page_id VARCHAR(100) DEFAULT NULL,
                ig_account_id VARCHAR(100) DEFAULT NULL,
                page_name VARCHAR(255) DEFAULT NULL,
                ig_username VARCHAR(100) DEFAULT NULL,
                access_token TEXT NOT NULL,
                token_type VARCHAR(50) DEFAULT 'long_lived',
                expires_at DATETIME DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        echo "  ✅ Table `meta_tokens` created successfully\n";
    }
    catch (PDOException $e) {
        echo "  ❌ Error creating table: " . $e->getMessage() . "\n";
        exit(1);
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
echo "\n══════ Meta OAuth States Table ══════\n\n";

// Check if table already exists
$stmt2 = $pdo->prepare(
    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'meta_oauth_states'"
);
$stmt2->execute([$dbname]);
$statesTableExists = (int)$stmt2->fetchColumn() > 0;

if ($statesTableExists) {
    echo "  ⏭️  Table `meta_oauth_states` already exists\n";
}
else {
    try {
        $pdo->exec("
            CREATE TABLE meta_oauth_states (
                token      VARCHAR(64)  NOT NULL PRIMARY KEY,
                user_id    INT          NOT NULL,
                expires_at DATETIME     NOT NULL,
                created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_expires_at (expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");
        echo "  ✅ Table `meta_oauth_states` created successfully\n";
    }
    catch (PDOException $e) {
        echo "  ❌ Error creating table: " . $e->getMessage() . "\n";
        exit(1);
    }
}

// Verify
echo "\n══════ Verifica ══════\n\n";
try {
    $stmt = $pdo->query("DESCRIBE meta_tokens");
    $cols = $stmt->fetchAll();
    echo "  Colonne nella tabella meta_tokens:\n";
    foreach ($cols as $col) {
        echo "    - {$col['Field']} ({$col['Type']})" . ($col['Key'] === 'PRI' ? ' [PK]' : '') . ($col['Key'] === 'UNI' ? ' [UNIQUE]' : '') . "\n";
    }
}
catch (PDOException $e) {
    echo "  ❌ Verifica fallita: " . $e->getMessage() . "\n";
}

try {
    $stmt = $pdo->query("DESCRIBE meta_oauth_states");
    $cols = $stmt->fetchAll();
    echo "  Colonne nella tabella meta_oauth_states:\n";
    foreach ($cols as $col) {
        echo "    - {$col['Field']} ({$col['Type']})" . ($col['Key'] === 'PRI' ? ' [PK]' : '') . "\n";
    }
}
catch (PDOException $e) {
    echo "  ❌ Verifica meta_oauth_states fallita: " . $e->getMessage() . "\n";
}

echo "\n" . str_repeat('─', 60) . "\n";
echo "🎉 Migration completata con successo!\n";
echo "⚠️  Ricordati di ELIMINARE questo file dal server per sicurezza.\n";