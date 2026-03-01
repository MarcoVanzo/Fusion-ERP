<?php
/**
 * Test Drive Upload — Diagnostica connessione Google Drive
 * Fusion ERP v1.0
 *
 * Eseguire UNA SOLA VOLTA per verificare la configurazione:
 *   php cron/test_drive_upload.php
 *
 * ⚠️  Questo script carica un piccolo file di test su Drive.
 *     Eliminarlo manualmente dopo il test se necessario.
 */

declare(strict_types=1);

define('FUSION_CRON', true);

$rootDir = dirname(__DIR__);
require_once $rootDir . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable($rootDir);
$dotenv->load();

use FusionERP\Shared\GoogleDrive;

$now = date('Y-m-d H:i:s');
echo "[{$now}] ====== Fusion ERP — Test Google Drive ======\n\n";

// ── Verifica variabili .env ───────────────────────────────────────────────────
$checks = [
    'GDRIVE_CLIENT_ID' => getenv('GDRIVE_CLIENT_ID'),
    'GDRIVE_CLIENT_SECRET' => getenv('GDRIVE_CLIENT_SECRET'),
    'GDRIVE_REFRESH_TOKEN' => getenv('GDRIVE_REFRESH_TOKEN'),
    'GDRIVE_FOLDER_ID' => getenv('GDRIVE_FOLDER_ID'),
];

$allOk = true;
foreach ($checks as $key => $val) {
    if (empty($val)) {
        echo "  ❌ {$key} — MANCANTE nel .env\n";
        $allOk = false;
    }
    else {
        $preview = strlen($val) > 30 ? substr($val, 0, 30) . '...' : $val;
        echo "  ✅ {$key} = {$preview}\n";
    }
}

if (!$allOk) {
    echo "\n❌ Configurazione incompleta. Aggiungi le variabili mancanti al .env.\n";
    exit(1);
}

// ── Crea file di test e carica su Drive ──────────────────────────────────────
echo "\n[STEP 1] Creazione file di test...\n";
$testFile = sys_get_temp_dir() . '/fusion_drive_test_' . date('Ymd_His') . '.txt';
$testContent = "Fusion ERP \xe2\x80\x94 Google Drive Test\nGenerato: " . date('Y-m-d H:i:s') . "\n";
file_put_contents($testFile, $testContent);
echo "  \xe2\x9c\x85 File creato: {$testFile}\n";

echo "\n[STEP 2] Upload su Google Drive...\n";
try {
    $driveFileId = GoogleDrive::uploadFile($testFile, basename($testFile));
    echo "  \xe2\x9c\x85 Upload completato!\n";
    echo "  \xf0\x9f\x93\x81 Drive File ID: {$driveFileId}\n";
    echo "\n\xe2\x9a\xa0\xef\xb8\x8f  Il file di test \xe2\x80\x9cfusion_drive_test_...txt\xe2\x80\x9d \xe3\x82\x92 bloccato su Drive come prova. Puoi eliminarlo manualmente se vuoi.\n";
}
catch (\Throwable $e) {
    echo "  \xe2\x9d\x8c Errore upload: " . $e->getMessage() . "\n";
    @unlink($testFile);
    exit(1);
}

@unlink($testFile);

echo "\n====== Test completato con successo! ======\n";
echo "Il sistema di backup con Google Drive \xc3\xa8 configurato correttamente.\n";
exit(0);