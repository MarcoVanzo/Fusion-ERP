<?php
/**
 * run_migration_v013.php — Crea la tabella outseason_entries
 * Usage: https://www.fusionteamvolley.it/ERP/run_migration_v013.php?token=FUSION_MIGRATE_2526
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
    putenv(trim($k) . '=' . trim(trim($v), '"\''));
}

try {
    $dsn = 'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: '3306') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4';
    $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "✅ DB connected\n\n";

    $sql = "CREATE TABLE IF NOT EXISTS outseason_entries (
        id                      INT UNSIGNED     NOT NULL AUTO_INCREMENT,
        cognito_id              INT UNSIGNED     NOT NULL,
        season_key              VARCHAR(10)      NOT NULL,
        nome_e_cognome          VARCHAR(200)     NOT NULL,
        email                   VARCHAR(200)     NULL,
        cellulare               VARCHAR(50)      NULL,
        codice_fiscale          VARCHAR(20)      NULL,
        data_di_nascita         DATE             NULL,
        indirizzo               VARCHAR(255)     NULL,
        cap                     VARCHAR(10)      NULL,
        citta                   VARCHAR(100)     NULL,
        provincia               VARCHAR(50)      NULL,
        club_di_appartenenza    VARCHAR(200)     NULL,
        ruolo                   VARCHAR(50)      NULL,
        taglia_kit              VARCHAR(10)      NULL,
        settimana_scelta        VARCHAR(100)     NULL,
        formula_scelta          VARCHAR(200)     NULL,
        come_vuoi_pagare        VARCHAR(100)     NULL,
        codice_sconto           VARCHAR(50)      NULL,
        entry_date              DATETIME         NULL,
        entry_status            VARCHAR(50)      NULL,
        order_summary           VARCHAR(200)     NULL,
        synced_at               DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_cognito_season (cognito_id, season_key),
        INDEX idx_ose_season (season_key),
        INDEX idx_ose_nome (nome_e_cognome)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    $pdo->exec($sql);
    echo "✅ Table outseason_entries created (or already exists)\n";

    // Check row count
    $count = $pdo->query("SELECT COUNT(*) FROM outseason_entries")->fetchColumn();
    echo "ℹ️  Current rows in outseason_entries: {$count}\n";

    echo "\n⚠️  DELETE this file after use!\n";
}
catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}