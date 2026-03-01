<?php
/**
 * add_meta_config_id.php — One-shot: aggiunge META_CONFIG_ID al .env di produzione
 * Usage: https://www.fusionteamvolley.it/ERP/add_meta_config_id.php?token=FUSION_CFG_2526
 * DELETE THIS FILE AFTER USE!
 */

if (($_GET['token'] ?? '') !== 'FUSION_CFG_2526') {
    http_response_code(403);
    die('Forbidden');
}

header('Content-Type: text/plain; charset=utf-8');

$envFile = __DIR__ . '/.env';
$content = file_get_contents($envFile);

if (str_contains($content, 'META_CONFIG_ID=')) {
    // Update existing value
    $content = preg_replace('/META_CONFIG_ID=.*/', 'META_CONFIG_ID=1618017095883461', $content);
    echo "✅ META_CONFIG_ID aggiornato\n";
}
else {
    // Append
    $content = rtrim($content) . "\nMETA_CONFIG_ID=1618017095883461\n";
    echo "✅ META_CONFIG_ID aggiunto\n";
}

file_put_contents($envFile, $content);

echo "Valore: META_CONFIG_ID=1618017095883461\n";
echo "\n⚠️  Elimina questo file dal server!\n";