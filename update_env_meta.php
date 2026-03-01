<?php
/**
 * update_env_meta.php — One-shot script to add Meta API vars to production .env
 * Usage: https://www.fusionteamvolley.it/ERP/update_env_meta.php?token=FUSION_ENV_META
 * DELETE THIS FILE AFTER USE!
 */

$EXPECTED_TOKEN = 'FUSION_ENV_META';

if (($_GET['token'] ?? '') !== $EXPECTED_TOKEN) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

header('Content-Type: text/plain; charset=utf-8');

$envFile = __DIR__ . '/.env';

if (!is_writable($envFile)) {
    echo "❌ .env file is not writable\n";
    exit(1);
}

$content = file_get_contents($envFile);

// Check if META vars already exist
if (str_contains($content, 'META_APP_ID=893727443280549')) {
    echo "⏭️  META vars already present with correct values\n";
    echo "\nCurrent META section:\n";
    foreach (explode("\n", $content) as $line) {
        if (str_contains($line, 'META_'))
            echo "  " . $line . "\n";
    }
    exit;
}

// Remove old META placeholders if they exist
$content = preg_replace('/\n?# ─── META BUSINESS API[^\n]*\n(META_[^\n]*\n)*/', '', $content);

// Append new META config
$metaBlock = "\n\n# ─── META BUSINESS API ────────────────────────────────────────────────\n";
$metaBlock .= "META_APP_ID=893727443280549\n";
$metaBlock .= "META_APP_SECRET=f16a98da08621d8c24c83fa787bba0b7\n";
$metaBlock .= "META_REDIRECT_URI=https://www.fusionteamvolley.it/ERP/api/router.php?module=social&action=callback\n";

$content = rtrim($content) . $metaBlock;

file_put_contents($envFile, $content);

echo "✅ META vars added to .env!\n\n";

// Verify
echo "Current META lines:\n";
foreach (explode("\n", $content) as $line) {
    if (str_contains($line, 'META_'))
        echo "  " . $line . "\n";
}

echo "\n⚠️  DELETE this file from the server now!\n";