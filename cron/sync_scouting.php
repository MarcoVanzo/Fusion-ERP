<?php
/**
 * Cron — Sync Scouting entries from Cognito Forms
 * Fusion ERP v1.0
 *
 * Run nightly via crontab:
 *   0 0 * * * php /path/to/ERP/cron/sync_scouting.php >> /tmp/fusion_scouting.log 2>&1
 *
 * Or manually:
 *   php cron/sync_scouting.php
 */

declare(strict_types=1);

// ── Bootstrap ───────────────────────────────────────────────────────────────
define('FUSION_CRON', true);

$rootDir = dirname(__DIR__);
require_once $rootDir . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createUnsafeImmutable($rootDir);
$dotenv->load();

use FusionERP\Modules\Scouting\ScoutingController;

$now = date('Y-m-d H:i:s');

echo "[{$now}] Scouting Sync — avvio...\n";

$result = ScoutingController::_doSync();

if (!$result['success']) {
    echo "[{$now}] ❌ ERRORE: {$result['error']}\n";
    exit(1);
}

$fusion = $result['fusion_upserted'] ?? 0;
$network = $result['network_upserted'] ?? 0;
$warnings = !empty($result['warnings']) ? ' | Avvisi: ' . implode(', ', $result['warnings']) : '';

echo "[{$now}] ✅ Sincronizzati: Fusion={$fusion}, Network={$network}{$warnings}\n";
exit(0);
