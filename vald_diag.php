<?php
/**
 * VALD Diagnostic v2 — ELIMINARE DOPO L'USO.
 */
header('Content-Type: text/plain; charset=utf-8');

require_once __DIR__ . '/vendor/autoload.php';

echo "=== VALD DIAGNOSTICS v2 ===\n\n";

// --- 1. Path resolution ---
echo "vald_diag.php __DIR__ : " . __DIR__ . "\n";
$envPath = __DIR__ . '/.env';
echo ".env path cercato     : $envPath\n";
echo ".env esiste           : " . (file_exists($envPath) ? 'SI' : 'NO') . "\n";

if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    echo ".env righe totali     : " . count($lines) . "\n";
    // Show only VALD_ lines (safe)
    echo "\nRighe VALD nel .env:\n";
    foreach ($lines as $i => $line) {
        if (strpos($line, 'VALD') !== false && strpos($line, '#') !== 0) {
            echo "  [riga " . ($i+1) . "] " . $line . "\n";
        }
    }
}

echo "\n--- Dotenv load ---\n";

// Try loading
try {
    $dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
    $dotenv->safeLoad();
    echo "safeLoad() completato senza eccezioni\n";
} catch (\Throwable $e) {
    echo "ERRORE safeLoad(): " . $e->getMessage() . "\n";
}

echo "\n--- Variabili ambiente ---\n";
$vars = ['VALD_CLIENT_ID', 'VALD_CLIENT_SECRET', 'VALD_ORG_ID', 'DB_PASS', 'SMTP_PASS'];
foreach ($vars as $v) {
    $fromGetenv = getenv($v);
    $fromEnv    = $_ENV[$v]    ?? null;
    $fromServer = $_SERVER[$v] ?? null;
    $val = $fromGetenv ?: $fromEnv ?: $fromServer ?: '(vuoto)';
    $display = strlen($val) > 8 ? substr($val, 0, 6) . '...[' . strlen($val) . 'c]' : $val;
    echo sprintf("%-22s getenv=%s | \$_ENV=%s | \$_SERVER=%s\n",
        $v . ':',
        $fromGetenv ? substr($fromGetenv, 0, 4).'...' : '(empty)',
        $fromEnv    ? substr($fromEnv,    0, 4).'...' : '(empty)',
        $fromServer ? substr($fromServer, 0, 4).'...' : '(empty)'
    );
}

echo "\n--- Test OAuth2 ---\n";
$clientId     = getenv('VALD_CLIENT_ID')     ?: ($_ENV['VALD_CLIENT_ID'] ?? '');
$clientSecret = getenv('VALD_CLIENT_SECRET') ?: ($_ENV['VALD_CLIENT_SECRET'] ?? '');

if (!$clientId || !$clientSecret) {
    echo "SKIP: credenziali vuote, impossibile testare OAuth2.\n";
} else {
    $ch = curl_init('https://auth.prd.vald.com/oauth/token');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
        'grant_type'    => 'client_credentials',
        'client_id'     => $clientId,
        'client_secret' => $clientSecret,
        'audience'      => 'vald-api-external',
    ]));
    $response = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    echo "HTTP Status : $httpCode\n";
    if ($curlError) { echo "cURL Error  : $curlError\n"; }
    else {
        $data = json_decode($response ?: '', true);
        if (isset($data['access_token'])) {
            echo "Token       : OK (" . substr($data['access_token'], 0, 20) . "...)\n";
        } else {
            echo "ERRORE      : " . ($data['error_description'] ?? $response) . "\n";
        }
    }
}
