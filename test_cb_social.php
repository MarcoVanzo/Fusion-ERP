<?php
/**
 * Inline callback test — no autoloader needed
 * Usage: https://www.fusionteamvolley.it/ERP/api/router.php?module=social&action=callback&state=SIMULATION&code=&_debug=FUSION_CB_TEST
 * 
 * Actually, simpler — test by hitting the callback URL with fake params
 * that won't go through to Meta but will show us where resolveOAuthToken fails.
 * 
 * Direct URL: https://www.fusionteamvolley.it/ERP/test_cb_social.php?token=FUSION_CB_TEST2
 */

declare(strict_types=1);

if (($_GET['token'] ?? '') !== 'FUSION_CB_TEST2') {
    http_response_code(403);
    die('Forbidden');
}

header('Content-Type: text/plain; charset=utf-8');

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

$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbname = getenv('DB_NAME') ?: 'fusion_erp';
$user = getenv('DB_USER') ?: '';
$pass = getenv('DB_PASS') ?: '';
$dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

echo "══════ DB Info ══════\n";
echo "host=$host port=$port dbname=$dbname user=$user\n\n";

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "✅ DB connesso\n\n";
}
catch (PDOException $e) {
    echo "❌ DB error: " . $e->getMessage() . "\n";
    exit(1);
}

// ─── Test 1: storeOAuthToken simulation ──────────────────────────────────
echo "══════ Test 1: INSERT token ══════\n";
$token = bin2hex(random_bytes(16));
$userId = 1;
$expires = date('Y-m-d H:i:s', time() + 600);

echo "token=$token user_id=$userId expires=$expires\n";

try {
    $stmt = $pdo->prepare(
        'INSERT INTO meta_oauth_states (token, user_id, expires_at)
         VALUES (:token, :user_id, :expires_at)
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), expires_at = VALUES(expires_at)'
    );
    $stmt->execute([':token' => $token, ':user_id' => $userId, ':expires_at' => $expires]);
    $affected = $stmt->rowCount();
    echo "✅ INSERT OK (rowCount=$affected)\n\n";
}
catch (PDOException $e) {
    echo "❌ INSERT error: " . $e->getMessage() . "\n";
    exit(1);
}

// ─── Test 2: resolveOAuthToken simulation ─────────────────────────────────
echo "══════ Test 2: SELECT token (same request) ══════\n";

try {
    $stmt2 = $pdo->prepare('SELECT user_id, expires_at FROM meta_oauth_states WHERE token = :token LIMIT 1');
    $stmt2->execute([':token' => $token]);
    $row = $stmt2->fetch();

    if ($row) {
        $userId2 = (int)$row['user_id'];
        $expired = strtotime($row['expires_at']) < time();
        echo "✅ SELECT OK: user_id=$userId2 expires={$row['expires_at']} expired=" . ($expired ? 'YES' : 'NO') . "\n\n";
    }
    else {
        echo "❌ Token non trovato dopo INSERT nella stessa richiesta PHP!\n\n";
    }
}
catch (PDOException $e) {
    echo "❌ SELECT error: " . $e->getMessage() . "\n";
}

// ─── Cleanup ──────────────────────────────────────────────────────────────
$pdo->prepare('DELETE FROM meta_oauth_states WHERE token = :token')->execute([':token' => $token]);
echo "✅ Token di test rimosso\n\n";

// ─── Test 3: Simulate what callback does ─────────────────────────────────
echo "══════ Test 3: CROSS-REQUEST simulation ══════\n";
echo "Inserisce token, poi simula una nuova request con NUOVO PDO\n\n";

// Insert like connect() would
$crossToken = bin2hex(random_bytes(16));
$stmt = $pdo->prepare(
    'INSERT INTO meta_oauth_states (token, user_id, expires_at)
     VALUES (:token, :user_id, :expires_at)'
);
$stmt->execute([':token' => $crossToken, ':user_id' => 1, ':expires_at' => date('Y-m-d H:i:s', time() + 600)]);
echo "Stored cross-token: $crossToken\n";

// Now simulate callback — brand new PDO connection
$pdo2 = new PDO($dsn, $user, $pass, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
]);

$stmt3 = $pdo2->prepare('SELECT user_id, expires_at FROM meta_oauth_states WHERE token = :token LIMIT 1');
$stmt3->execute([':token' => $crossToken]);
$row3 = $stmt3->fetch();

if ($row3) {
    echo "✅ Cross-request SELECT OK: user_id={$row3['user_id']}\n";
    echo "   ✅ DB funziona correttamente tra richieste diverse!\n";
}
else {
    echo "❌ Cross-request SELECT FALLITO — il token non persiste tra richieste!\n";
    echo "   Questa è la causa del problema OAuth!\n";
}

$pdo2->prepare('DELETE FROM meta_oauth_states WHERE token = :token')->execute([':token' => $crossToken]);

// ─── Test 4: Check all tokens in DB ──────────────────────────────────────
echo "\n══════ Test 4: Token attuali nel DB ══════\n";
$all = $pdo->query("SELECT token, user_id, expires_at, created_at FROM meta_oauth_states ORDER BY created_at DESC LIMIT 10")->fetchAll();
if (empty($all)) {
    echo "  (tabella vuota)\n";
}
else {
    foreach ($all as $r) {
        $exp = strtotime($r['expires_at']) < time() ? '[SCADUTO]' : '[VALIDO]';
        echo "  " . substr($r['token'], 0, 10) . "... user={$r['user_id']} expires={$r['expires_at']} $exp created={$r['created_at']}\n";
    }
}

echo "\n" . str_repeat('─', 60) . "\n";
echo "⚠️  Elimina questo file!\n";