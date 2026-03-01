<?php
/**
 * Cron — Sync Out Season entries from Cognito Forms
 * Fusion ERP v1.0
 *
 * Run nightly via crontab (adjust paths):
 *   0 3 * * * php /var/www/html/ERP/cron/sync_outseason.php >> /var/log/fusion_outseason.log 2>&1
 *
 * Or manually:
 *   php cron/sync_outseason.php
 */

declare(strict_types=1);

// ── Bootstrap ───────────────────────────────────────────────────────────────
define('FUSION_CRON', true);

$rootDir = dirname(__DIR__);
require_once $rootDir . '/vendor/autoload.php';

// Load .env
$dotenv = Dotenv\Dotenv::createUnsafeImmutable($rootDir);
$dotenv->load();

use FusionERP\Modules\OutSeason\OutSeasonController;

$seasonKey = $argv[1] ?? '2026';
$now = date('Y-m-d H:i:s');

echo "[{$now}] OutSeason Sync — stagione {$seasonKey} — avvio...\n";

$result = OutSeasonController::_doSync($seasonKey);

if (!$result['success']) {
    echo "[{$now}] ❌ ERRORE: {$result['error']}\n";
    exit(1);
}

echo "[{$now}] ✅ Sincronizzate {$result['upserted']} iscritte da Cognito.\n";
exit(0);