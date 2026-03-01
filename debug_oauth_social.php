<?php
/**
 * debug_oauth_social.php — Diagnostica flow OAuth Meta
 * Usage: https://www.fusionteamvolley.it/ERP/debug_oauth_social.php?token=FUSION_DEBUG_SOCIAL
 *
 * SECURITY: This file is DISABLED in production (APP_ENV=production).
 * It is kept for local/staging debugging only. DELETE AFTER USE if deployed.
 */

declare(strict_types=1);

// \u2500\u2500 Load .env to read APP_ENV early \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

// \u2500\u2500 Block in production \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
if (getenv('APP_ENV') === 'production') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Debug endpoint disabled in production.']);
    exit;
}

$EXPECTED_TOKEN = 'FUSION_DEBUG_SOCIAL';

if (($_GET['token'] ?? '') !== $EXPECTED_TOKEN) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

header('Content-Type: text/plain; charset=utf-8');

// ─── Load .env ────────────────────────────────────────────────────────────────
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

echo "══════ Variabili META in .env ══════\n\n";
$metaVars = ['META_APP_ID', 'META_APP_SECRET', 'META_REDIRECT_URI', 'META_CONFIG_ID', 'APP_URL'];
foreach ($metaVars as $var) {
    $val = getenv($var);
    if ($var === 'META_APP_SECRET' && !empty($val)) {
        $val = substr($val, 0, 4) . '****' . substr($val, -4); // mask secret
    }
    echo "  {$var}=" . ($val ?: '(NOT SET)') . "\n";
}

// ─── DB connection ────────────────────────────────────────────────────────────
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'fusion_erp';
$user = getenv('DB_USER') ?: '';
$pass = getenv('DB_PASS') ?: '';
$dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

echo "\n══════ Connessione DB ══════\n\n";
try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "  ✅ Connected to {$host}:{$port}/{$dbname}\n";
}
catch (PDOException $e) {
    echo "  ❌ DB connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// ─── Check meta_oauth_states table ───────────────────────────────────────────
echo "\n══════ Tabella meta_oauth_states ══════\n\n";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as cnt FROM meta_oauth_states");
    $row = $stmt->fetch();
    echo "  ✅ Tabella esiste. Righe attuali: " . $row['cnt'] . "\n";

    // Show recent entries
    $stmt2 = $pdo->query("SELECT token, user_id, expires_at, created_at FROM meta_oauth_states ORDER BY created_at DESC LIMIT 5");
    $rows = $stmt2->fetchAll();
    if (empty($rows)) {
        echo "  (nessun token OAuth salvato)\n";
    }
    else {
        echo "\n  Ultimi token salvati:\n";
        foreach ($rows as $r) {
            $expired = strtotime($r['expires_at']) < time() ? ' [SCADUTO]' : ' [VALIDO]';
            echo "    token=" . substr($r['token'], 0, 8) . "... | user_id={$r['user_id']} | expires={$r['expires_at']}{$expired} | created={$r['created_at']}\n";
        }
    }
}
catch (PDOException $e) {
    echo "  ❌ Errore: " . $e->getMessage() . "\n";
}

// ─── Check meta_tokens table ──────────────────────────────────────────────────
echo "\n══════ Tabella meta_tokens ══════\n\n";
try {
    $stmt = $pdo->query("SELECT user_id, ig_username, page_name, expires_at, updated_at FROM meta_tokens LIMIT 5");
    $rows = $stmt->fetchAll();
    if (empty($rows)) {
        echo "  (nessun token Meta salvato)\n";
    }
    else {
        foreach ($rows as $r) {
            $expired = ($r['expires_at'] && strtotime($r['expires_at']) < time()) ? ' [SCADUTO]' : ' [OK]';
            echo "  user_id={$r['user_id']} | ig=@{$r['ig_username']} | page={$r['page_name']} | expires={$r['expires_at']}{$expired}\n";
        }
    }
}
catch (PDOException $e) {
    echo "  ❌ Errore: " . $e->getMessage() . "\n";
}

// ─── Simulate storeOAuthToken ─────────────────────────────────────────────────
echo "\n══════ Test: Inserimento token OAuth di test ══════\n\n";
$testToken = bin2hex(random_bytes(16));
$testUserId = 1;
$testExpires = date('Y-m-d H:i:s', time() + 600);

try {
    $stmt = $pdo->prepare(
        'INSERT INTO meta_oauth_states (token, user_id, expires_at)
         VALUES (:token, :user_id, :expires_at)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), expires_at = VALUES(expires_at)'
    );
    $stmt->execute([':token' => $testToken, ':user_id' => $testUserId, ':expires_at' => $testExpires]);
    echo "  ✅ INSERT riuscito. Token test: " . substr($testToken, 0, 8) . "...\n";

    // Now test resolveOAuthToken
    $stmt2 = $pdo->prepare('SELECT user_id, expires_at FROM meta_oauth_states WHERE token = :token LIMIT 1');
    $stmt2->execute([':token' => $testToken]);
    $row = $stmt2->fetch();

    if ($row) {
        echo "  ✅ SELECT riuscito. user_id={$row['user_id']}, expires_at={$row['expires_at']}\n";
    }
    else {
        echo "  ❌ SELECT fallito — token non trovato subito dopo l'INSERT!\n";
    }

    // Cleanup
    $pdo->prepare('DELETE FROM meta_oauth_states WHERE token = :token')->execute([':token' => $testToken]);
    echo "  ✅ Cleanup token di test effettuato.\n";
}
catch (PDOException $e) {
    echo "  ❌ Errore: " . $e->getMessage() . "\n";
}

// ─── Genera URL OAuth di test ─────────────────────────────────────────────────
echo "\n══════ URL OAuth generato ══════\n\n";
$appId = getenv('META_APP_ID');
$redirectUri = getenv('META_REDIRECT_URI');
$configId = getenv('META_CONFIG_ID');
$sampleState = 'aabbccddeeff00112233445566778899'; // sample 32-char hex

if (!empty($appId)) {
    $params = [
        'client_id' => $appId,
        'redirect_uri' => $redirectUri,
        'response_type' => 'code',
        'state' => $sampleState,
    ];
    if (!empty($configId)) {
        $params['config_id'] = $configId;
    }
    else {
        $params['scope'] = 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement';
    }
    $oauthUrl = 'https://www.facebook.com/v21.0/dialog/oauth?' . http_build_query($params);
    echo "  URL di autenticazione:\n  " . $oauthUrl . "\n";
    echo "\n  REDIRECT URI nel URL:\n  " . urldecode($redirectUri) . "\n";
}
else {
    echo "  ❌ META_APP_ID non configurato!\n";
}

echo "\n" . str_repeat('─', 60) . "\n";
echo "⚠️  Elimina questo file dopo aver completato la diagnostica!\n";