<?php
/**
 * Cron — Nightly Database Backup + Google Drive Upload
 * Fusion ERP v1.0
 *
 * Run every night at midnight via crontab:
 *   0 0 * * * php /var/www/html/ERP/cron/backup_nightly.php >> /var/log/fusion_backup.log 2>&1
 *
 * Or run manually to test:
 *   php cron/backup_nightly.php
 */

declare(strict_types=1);

// ── Bootstrap ────────────────────────────────────────────────────────────────
define('FUSION_CRON', true);

$rootDir = dirname(__DIR__);
require_once $rootDir . '/vendor/autoload.php';

// Load .env
$dotenv = Dotenv\Dotenv::createUnsafeImmutable($rootDir);
$dotenv->load();

use FusionERP\Shared\BackupService;
use FusionERP\Modules\Admin\AdminRepository;
use FusionERP\Shared\GoogleDrive;

$now = date('Y-m-d H:i:s');
echo "[{$now}] ====== Fusion ERP — Nightly Backup ======\n";

// ── 1. Execute backup dump ────────────────────────────────────────────────────
echo "[{$now}] Avvio dump database...\n";

$service = new BackupService(new AdminRepository());
$result = $service->dump(null, 'Cron Automatico');

if (!$result['success']) {
    echo "[{$now}] ❌ ERRORE dump: {$result['error']}\n";
    exit(1);
}

$now = date('Y-m-d H:i:s');
echo "[{$now}] ✅ Dump completato: {$result['filename']} (" . number_format($result['filesize'] / 1024, 1) . " KB, {$result['total_rows']} righe)\n";

// ── 2. Upload to Google Drive ─────────────────────────────────────────────────
$driveEnabled = !empty(getenv('GDRIVE_CLIENT_ID')) && !empty(getenv('GDRIVE_REFRESH_TOKEN'));

if (!$driveEnabled) {
    echo "[{$now}] ⚠️  Google Drive non configurato — salto upload (GDRIVE_CLIENT_ID o GDRIVE_REFRESH_TOKEN mancanti nel .env)\n";
    echo "[{$now}] ====== Fine Backup ======\n";
    exit(0);
}

echo "[{$now}] Caricamento su Google Drive...\n";

try {
    $driveFileId = GoogleDrive::uploadFile($result['filepath'], $result['filename']);

    // Update DB record with Drive info
    $repo = new AdminRepository();
    $repo->updateBackupDriveInfo($result['id'], $driveFileId);

    $now = date('Y-m-d H:i:s');
    echo "[{$now}] ✅ Upload completato — Drive File ID: {$driveFileId}\n";
    echo "[{$now}] ====== Fine Backup — SUCCESSO ======\n";
    exit(0);
}
catch (\Throwable $e) {
    $now = date('Y-m-d H:i:s');
    echo "[{$now}] ❌ ERRORE upload Drive: " . $e->getMessage() . "\n";
    echo "[{$now}] ⚠️  Backup locale disponibile: {$result['filename']}\n";
    echo "[{$now}] ====== Fine Backup — PARZIALE (solo locale) ======\n";
    exit(2); // exit 2 = backup ok ma Drive fallito
}