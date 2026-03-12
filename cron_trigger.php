<?php
/**
 * cron_trigger.php — Backup via URL (per hosting condiviso Aruba)
 *
 * Chiamare ogni notte a mezzanotte, es. da cron-job.org:
 *   GET https://www.fusionteamvolley.it/ERP/cron_trigger.php?token=FUSION_CRON_2526
 *
 * Exit: risponde con JSON {success, message, ...}
 */

declare(strict_types=1);
define('FUSION_CRON', true);

// ── Sicurezza: token segreto ──────────────────────────────────────────────────
$expectedToken = 'FUSION_CRON_2526';
$providedToken = $_GET['token'] ?? '';

if (!hash_equals($expectedToken, $providedToken)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Forbidden']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// ── Bootstrap ─────────────────────────────────────────────────────────────────
$rootDir = __DIR__;
require_once $rootDir . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable($rootDir);
$dotenv->load();

// ── Database ──────────────────────────────────────────────────────────────────
use FusionERP\Shared\Database;
use FusionERP\Shared\GoogleDrive;
use FusionERP\Shared\BackupService;
use FusionERP\Modules\Admin\AdminRepository;

$startTime = microtime(true);
$log = [];

try {
    $db = Database::getInstance();
    $repo = new AdminRepository($db);

    // ── 1. Esegui il dump ────────────────────────────────────────────────────
    $result = (new BackupService($repo))->dump(null, 'Cron Automatico (Web)');
    if (!$result['success'] || isset($result['error'])) {
        throw new \RuntimeException('Dump fallito: ' . ($result['error'] ?? 'errore sconosciuto'));
    }

    $log[] = "✅ Dump: {$result['filename']} ({$result['table_count']} tabelle, {$result['total_rows']} righe)";

    // ── 2. Upload su Google Drive ────────────────────────────────────────────
    $driveFileId = null;
    $driveError = null;

    $driveEnabled = !empty(getenv('GDRIVE_CLIENT_ID')) && !empty(getenv('GDRIVE_REFRESH_TOKEN'));
    if ($driveEnabled) {
        try {
            $driveFileId = GoogleDrive::uploadFile($result['filepath'], $result['filename']);
            $repo->updateBackupDriveInfo($result['id'], $driveFileId);
            $log[] = "☁️ Drive: OK (ID: {$driveFileId})";
        }
        catch (\Throwable $e) {
            $driveError = $e->getMessage();
            $log[] = "⚠️ Drive: {$driveError}";
        }
    }
    else {
        $log[] = "ℹ️ Drive non configurato (variabili GDRIVE_* mancanti)";
    }

    $elapsed = round(microtime(true) - $startTime, 2);
    $log[] = "⏱ Tempo: " . $elapsed . "s";

    echo json_encode([
        'success' => true,
        'filename' => $result['filename'],
        'table_count' => count($result['table_names']),
        'row_count' => $result['total_rows'],
        'drive_file_id' => $driveFileId,
        'drive_error' => $driveError,
        'elapsed_s' => $elapsed,
        'log' => $log,
        'timestamp' => date('Y-m-d H:i:s'),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

}
catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'log' => $log,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}