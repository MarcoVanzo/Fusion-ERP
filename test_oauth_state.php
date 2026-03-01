<?php
/**
 * test_oauth_state.php — diagnostic for OAuth state encode/decode
 * Usage: https://www.fusionteamvolley.it/ERP/test_oauth_state.php?token=FUSION_DIAG
 * DELETE AFTER USE!
 */
if (($_GET['token'] ?? '') !== 'FUSION_DIAG') {
    http_response_code(403);
    die('Forbidden');
}
header('Content-Type: text/plain; charset=utf-8');

// Load .env
$envFile = __DIR__ . '/.env';
foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with(trim($line), '#') || !str_contains($line, '='))
        continue;
    [$k, $v] = explode('=', $line, 2);
    putenv(trim($k) . '=' . trim($v));
}

$secret = getenv('META_APP_SECRET');
$configId = getenv('META_CONFIG_ID');
$appId = getenv('META_APP_ID');

echo "=== META ENV CHECK ===\n";
echo "APP_ID:    " . ($appId ?: '❌ MISSING') . "\n";
echo "SECRET:    " . ($secret ? '✅ set (' . strlen($secret) . ' chars)' : '❌ MISSING') . "\n";
echo "CONFIG_ID: " . ($configId ?: '❌ MISSING') . "\n\n";

// Test encode → decode round trip
$userId = 42;
$nonce = bin2hex(random_bytes(8));
$payload = $userId . '.' . $nonce;
$sig = hash_hmac('sha256', $payload, $secret);
$state = rtrim(strtr(base64_encode($payload . '.' . $sig), '+/', '-_'), '=');

echo "=== ENCODE TEST (userId=$userId) ===\n";
echo "payload: $payload\n";
echo "sig:     " . substr($sig, 0, 16) . "...\n";
echo "state:   $state\n\n";

// Decode
echo "=== DECODE TEST ===\n";
$padded = $state . str_repeat('=', (4 - strlen($state) % 4) % 4);
$decoded = base64_decode(strtr($padded, '-_', '+/'), true);
echo "padded:  $padded\n";
echo "decoded: $decoded\n";

$lastDot = strrpos($decoded, '.');
$sigBack = substr($decoded, $lastDot + 1);
$payBack = substr($decoded, 0, $lastDot);
$expected = hash_hmac('sha256', $payBack, $secret);
$match = hash_equals($expected, $sigBack);

echo "payload back: $payBack\n";
echo "HMAC match:   " . ($match ? '✅ YES' : '❌ NO') . "\n";
echo "userId back:  " . (int)explode('.', $payBack)[0] . "\n\n";

// Now test what Facebook would return — check if filter_input changes anything
$simulatedState = $_GET['sim_state'] ?? null;
if ($simulatedState) {
    echo "=== SIM DECODE (sim_state from URL) ===\n";
    echo "raw: $simulatedState\n";
    $p2 = $simulatedState . str_repeat('=', (4 - strlen($simulatedState) % 4) % 4);
    $d2 = base64_decode(strtr($p2, '-_', '+/'), true);
    echo "decoded: " . ($d2 ?: '❌ FAIL') . "\n";
}

echo "\n✅ Done. Delete this file!\n";