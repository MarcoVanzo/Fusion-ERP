<?php
/**
 * capture_callback.php — Temporarily intercepts the OAuth callback to see raw params
 * Deploy this, then set the Meta App redirect URI to point here temporarily.
 * Usage: set redirect_uri to https://www.fusionteamvolley.it/ERP/capture_callback.php
 * then authorize the app, and read the output.
 * DELETE THIS FILE IMMEDIATELY AFTER USE!
 */
header('Content-Type: text/plain; charset=utf-8');

echo "=== OAUTH CALLBACK CAPTURE ===\n\n";
echo "TIME: " . date('Y-m-d H:i:s') . "\n\n";

echo "--- RAW _GET PARAMS ---\n";
foreach ($_GET as $k => $v) {
    echo "$k = $v\n";
}

echo "\n--- STATE ANALYSIS ---\n";
$state = $_GET['state'] ?? '(missing)';
echo "state value: $state\n";
echo "state length: " . strlen($state) . "\n";

// Load env to test decode
$envFile = __DIR__ . '/.env';
foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with(trim($line), '#') || !str_contains($line, '='))
        continue;
    [$k, $v] = explode('=', $line, 2);
    putenv(trim($k) . '=' . trim($v));
}
$secret = getenv('META_APP_SECRET');

// Attempt decode
$padded = $state . str_repeat('=', (4 - strlen($state) % 4) % 4);
$decoded = base64_decode(strtr($padded, '-_', '+/'), true);

if (!$decoded) {
    echo "\n❌ base64_decode FAILED\n";
    echo "padded: $padded\n";
}
else {
    echo "\ndecoded: $decoded\n";
    $lastDot = strrpos($decoded, '.');
    if ($lastDot === false) {
        echo "❌ no dot found in decoded\n";
    }
    else {
        $sig = substr($decoded, $lastDot + 1);
        $payload = substr($decoded, 0, $lastDot);
        $expected = hash_hmac('sha256', $payload, $secret);
        $match = hash_equals($expected, $sig);
        echo "payload:    $payload\n";
        echo "sig recv:   " . substr($sig, 0, 16) . "...\n";
        echo "sig expect: " . substr($expected, 0, 16) . "...\n";
        echo "HMAC match: " . ($match ? '✅ YES' : '❌ NO') . "\n";
        if ($match) {
            echo "userId:     " . (int)explode('.', $payload)[0] . "\n";
        }
    }
}

echo "\n--- SERVER INFO ---\n";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? '') . "\n";
echo "QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? '') . "\n";

echo "\n⚠️  DELETE THIS FILE. Do NOT leave on production.\n";