<?php
/**
 * VALD Diagnostic — testa la connettività e le credenziali sul server di produzione.
 * ELIMINARE DOPO L'USO.
 */
header('Content-Type: text/plain; charset=utf-8');

// --- 1. Load .env via Dotenv ---
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

echo "=== VALD DIAGNOSTICS ===\n\n";

// --- 2. Environment variables ---
$clientId     = getenv('VALD_CLIENT_ID')     ?: '(vuoto)';
$clientSecret = getenv('VALD_CLIENT_SECRET') ?: '(vuoto)';
$orgId        = getenv('VALD_ORG_ID')        ?: '(vuoto)';
$identityUrl  = getenv('VALD_IDENTITY_URL')  ?: 'https://auth.prd.vald.com/oauth/token (default)';

echo "VALD_CLIENT_ID     : " . (strlen($clientId) > 5 ? substr($clientId, 0, 6) . '...' : $clientId) . "\n";
echo "VALD_CLIENT_SECRET : " . (strlen($clientSecret) > 5 ? substr($clientSecret, 0, 6) . '...' : $clientSecret) . "\n";
echo "VALD_ORG_ID        : $orgId\n";
echo "VALD_IDENTITY_URL  : $identityUrl\n\n";

// --- 3. cURL availability ---
echo "cURL disponibile   : " . (function_exists('curl_init') ? "SI" : "NO") . "\n";
echo "OpenSSL            : " . (defined('OPENSSL_VERSION_TEXT') ? OPENSSL_VERSION_TEXT : 'N/A') . "\n\n";

// --- 4. Test actual OAuth2 request ---
if (!function_exists('curl_init')) {
    echo "ERRORE: cURL non disponibile sul server. Impossibile contattare VALD.\n";
    exit;
}

$authUrl = getenv('VALD_IDENTITY_URL') ?: 'https://auth.prd.vald.com/oauth/token';
echo "Tentativo autenticazione su: $authUrl\n";

$ch = curl_init($authUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'grant_type'    => 'client_credentials',
    'client_id'     => getenv('VALD_CLIENT_ID') ?: '',
    'client_secret' => getenv('VALD_CLIENT_SECRET') ?: '',
    'audience'      => 'vald-api-external',
]));

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

echo "HTTP Status        : $httpCode\n";

if ($curlError) {
    echo "cURL Error         : $curlError\n";
} else {
    $data = json_decode($response ?: '', true);
    if (isset($data['access_token'])) {
        echo "Token ottenuto     : OK (" . substr($data['access_token'], 0, 20) . "...)\n";
        echo "Scade tra          : " . ($data['expires_in'] ?? '?') . " secondi\n";
    } else {
        echo "ERRORE Token       : " . ($data['error'] ?? '') . " — " . ($data['error_description'] ?? $response) . "\n";
    }
}
