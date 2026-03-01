<?php
/**
 * run_migration_v010.php — Crea la tabella meta_oauth_states
 * Usage: https://www.fusionteamvolley.it/ERP/run_migration_v010.php?token=FUSION_MIGRATE_2526
 * DELETE THIS FILE AFTER USE!
 */
if (($_GET['token'] ?? '') !== 'FUSION_MIGRATE_2526') {
    http_response_code(403);
    die('Forbidden');
}
header('Content-Type: text/plain; charset=utf-8');

// Load .env
foreach (file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with(trim($line), '#') || !str_contains($line, '='))
        continue;
    [$k, $v] = explode('=', $line, 2);
    putenv(trim($k) . '=' . trim($v));
}

try {
    $dsn = 'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: '3306') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4';
    $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "✅ DB connected\n\n";

    $sql = "CREATE TABLE IF NOT EXISTS meta_oauth_states (
        token      VARCHAR(64)  NOT NULL PRIMARY KEY,
        user_id    INT          NOT NULL,
        expires_at DATETIME     NOT NULL,
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_expires_at (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $pdo->exec($sql);
    echo "✅ Table meta_oauth_states created (or already exists)\n";
    echo "\n⚠️ Delete this file!\n";
}
catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}