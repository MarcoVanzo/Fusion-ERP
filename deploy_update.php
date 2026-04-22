<?php
/**
 * Fusion ERP — Deploy Update v3 (HTTP Pull from GitHub)
 *
 * Deploy incrementale pull-based (allineato con MV ERP):
 * 1. Scarica manifest con hash da GitHub
 * 2. Confronta con stato precedente (deploy_state.json)
 * 3. Scarica solo i file cambiati in cartella temp
 * 4. Verifica integrità SHA-256
 * 5. Backup file vecchi
 * 6. Swap dei file nuovi
 * 7. Health check post-deploy
 * 8. Rollback automatico se fallisce
 *
 * Autenticazione: Header X-Deploy-Key
 */

declare(strict_types=1);

if (function_exists('opcache_invalidate')) {
    opcache_invalidate(__FILE__, true);
}

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');
ini_set('max_execution_time', '300');

// ── Carica .env ──────────────────────────────────────────────────────────────

$envPaths = [__DIR__ . '/.env', __DIR__ . '/../.env'];
foreach ($envPaths as $envPath) {
    if (file_exists($envPath)) {
        $envContent = @file_get_contents($envPath);
        if ($envContent && preg_match_all('/^([^#=\r\n]+)=(.*)$/m', $envContent, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $m) {
                $key = trim($m[1]);
                $val = trim(trim($m[2]), '"\'');
                putenv("$key=$val");
                $_ENV[$key] = $val;
            }
        }
        break;
    }
}

// ── Costanti ──────────────────────────────────────────────────────────────────

$storageDir = __DIR__ . '/storage';
if (!is_dir($storageDir)) {
    mkdir($storageDir, 0755, true);
}

define('DEPLOY_STATE_FILE', $storageDir . '/deploy_state.json');
define('DEPLOY_LOCK_FILE',  $storageDir . '/deploy.lock');
define('DEPLOY_TEMP_DIR',   $storageDir . '/deploy_tmp');
define('DEPLOY_BACKUP_DIR', $storageDir . '/deploy_backup');
define('DEPLOY_LOG_FILE',   $storageDir . '/deploy_log.json');
define('DEPLOY_COOLDOWN',   60);

// ── Rate limiting ─────────────────────────────────────────────────────────────

if (file_exists(DEPLOY_LOCK_FILE)) {
    $lockAge = time() - filemtime(DEPLOY_LOCK_FILE);
    if ($lockAge < DEPLOY_COOLDOWN) {
        sendJsonResponse('error', 'Deploy in cooldown', [
            'retry_after' => DEPLOY_COOLDOWN - $lockAge
        ], 429);
    }
    if ($lockAge > 300) {
        @unlink(DEPLOY_LOCK_FILE);
    }
}

// ── Autenticazione ────────────────────────────────────────────────────────────

$deployKey = getenv('DEPLOY_KEY') ?: ($_ENV['DEPLOY_KEY'] ?? '');

if (!$deployKey) {
    sendJsonResponse('error', 'DEPLOY_KEY non configurata sul server', [], 500);
}

$providedKey = $_SERVER['HTTP_X_DEPLOY_KEY'] ?? '';

if (empty($providedKey) || !hash_equals(trim($deployKey), trim($providedKey))) {
    http_response_code(403);
    usleep(500000);
    sendJsonResponse('error', 'Accesso negato: chiave non valida', [], 403);
}

// ── Lock ──────────────────────────────────────────────────────────────────────

file_put_contents(DEPLOY_LOCK_FILE, json_encode([
    'pid'        => getmypid(),
    'started_at' => date('c'),
    'ip'         => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
]));

register_shutdown_function(function () {
    if (file_exists(DEPLOY_LOCK_FILE)) {
        $lock = json_decode(@file_get_contents(DEPLOY_LOCK_FILE), true) ?: [];
        $lock['finished_at'] = date('c');
        @file_put_contents(DEPLOY_LOCK_FILE, json_encode($lock));
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DEPLOY FLOW
// ═══════════════════════════════════════════════════════════════════════════════

$deployLog  = [];
$startTime  = microtime(true);
$repo       = 'MarcoVanzo/Fusion-ERP';
$branch     = 'main';

try {
    // ── Step 1: SHA ultimo commit ────────────────────────────────────────────

    logStep($deployLog, 'fetch_sha', 'Recupero SHA ultimo commit...');
    $latestCommitSha = fetchLatestCommitSha($repo, $branch);
    logStep($deployLog, 'fetch_sha', "SHA: " . substr($latestCommitSha, 0, 8), 'ok');

    // ── Step 2: Manifest ─────────────────────────────────────────────────────

    logStep($deployLog, 'fetch_manifest', 'Download manifest da GitHub...');
    $manifest = fetchManifest($repo, $latestCommitSha);

    if (!$manifest || empty($manifest['files'])) {
        throw new RuntimeException('Manifest vuoto o non valido');
    }
    logStep($deployLog, 'fetch_manifest', $manifest['file_count'] . ' file nel manifest', 'ok');

    // ── Step 3: Diff ─────────────────────────────────────────────────────────

    logStep($deployLog, 'diff', 'Calcolo differenze...');
    $previousState = loadDeployState();
    $filesToUpdate = [];
    $filesToSkip   = 0;

    foreach ($manifest['files'] as $entry) {
        $path = $entry['path'];
        $hash = $entry['hash'];
        if (isset($previousState[$path]) && $previousState[$path] === $hash) {
            $filesToSkip++;
            continue;
        }
        $filesToUpdate[] = $entry;
    }

    logStep($deployLog, 'diff', count($filesToUpdate) . " da aggiornare, {$filesToSkip} invariati", 'ok');

    if (empty($filesToUpdate)) {
        saveDeployLog($deployLog, $startTime, 'ok', 0, $filesToSkip, 0);
        sendJsonResponse('ok', 'Nessun file da aggiornare', [
            'summary' => ['updated' => 0, 'skipped' => $filesToSkip, 'failed' => 0],
            'elapsed_ms' => elapsed($startTime)
        ]);
    }

    // ── Step 4: Download in temp ─────────────────────────────────────────────

    logStep($deployLog, 'download', 'Download ' . count($filesToUpdate) . ' file...');
    cleanDir(DEPLOY_TEMP_DIR);
    if (!is_dir(DEPLOY_TEMP_DIR)) {
        mkdir(DEPLOY_TEMP_DIR, 0755, true);
    }

    $downloaded   = [];
    $downloadFail = [];

    foreach ($filesToUpdate as $entry) {
        $path = $entry['path'];
        $hash = $entry['hash'];
        $content = downloadFileFromGitHub($repo, $latestCommitSha, $path);

        if ($content === false) {
            $downloadFail[] = $path;
            continue;
        }

        $actualHash = hash('sha256', $content);
        if ($actualHash !== $hash) {
            $downloadFail[] = "{$path} (hash mismatch)";
            continue;
        }

        $tempPath = DEPLOY_TEMP_DIR . '/' . $path;
        $tempDir  = dirname($tempPath);
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        file_put_contents($tempPath, $content);
        $downloaded[] = $entry;
    }

    logStep($deployLog, 'download', count($downloaded) . ' OK, ' . count($downloadFail) . ' falliti',
        empty($downloadFail) ? 'ok' : 'warning');

    if (count($downloadFail) > 0 && count($downloadFail) >= count($filesToUpdate) * 0.5) {
        throw new RuntimeException('Troppi file falliti (' . count($downloadFail) . '/' . count($filesToUpdate) . ')');
    }

    // ── Step 5: Backup ──────────────────────────────────────────────────────

    logStep($deployLog, 'backup', 'Backup file esistenti...');
    cleanDir(DEPLOY_BACKUP_DIR);
    if (!is_dir(DEPLOY_BACKUP_DIR)) {
        mkdir(DEPLOY_BACKUP_DIR, 0755, true);
    }

    $backedUp = 0;
    foreach ($downloaded as $entry) {
        $originalPath = __DIR__ . '/' . $entry['path'];
        if (file_exists($originalPath)) {
            $backupPath = DEPLOY_BACKUP_DIR . '/' . $entry['path'];
            $backupDir  = dirname($backupPath);
            if (!is_dir($backupDir)) {
                mkdir($backupDir, 0755, true);
            }
            copy($originalPath, $backupPath);
            $backedUp++;
        }
    }
    logStep($deployLog, 'backup', "{$backedUp} file nel backup", 'ok');

    // ── Step 6: Swap ────────────────────────────────────────────────────────

    logStep($deployLog, 'swap', 'Installazione file...');
    $installed   = 0;
    $installFail = [];

    foreach ($downloaded as $entry) {
        $srcPath  = DEPLOY_TEMP_DIR . '/' . $entry['path'];
        $destPath = __DIR__ . '/' . $entry['path'];
        $destDir  = dirname($destPath);

        if (!is_dir($destDir)) {
            mkdir($destDir, 0755, true);
        }

        if (@copy($srcPath, $destPath)) {
            $installed++;
            if (function_exists('opcache_invalidate') && str_ends_with($entry['path'], '.php')) {
                opcache_invalidate(realpath($destPath) ?: $destPath, true);
            }
        } else {
            $installFail[] = $entry['path'];
        }
    }

    logStep($deployLog, 'swap', "{$installed} installati, " . count($installFail) . " falliti",
        empty($installFail) ? 'ok' : 'warning');

    // ── Step 7: Health check ────────────────────────────────────────────────

    logStep($deployLog, 'health', 'Health check...');
    $healthOk = performHealthCheck();

    if (!$healthOk) {
        logStep($deployLog, 'rollback', 'Health check FALLITO — rollback...');
        $rolledBack = 0;
        foreach ($downloaded as $entry) {
            $backupPath = DEPLOY_BACKUP_DIR . '/' . $entry['path'];
            $destPath   = __DIR__ . '/' . $entry['path'];
            if (file_exists($backupPath)) {
                @copy($backupPath, $destPath);
                $rolledBack++;
                if (function_exists('opcache_invalidate') && str_ends_with($entry['path'], '.php')) {
                    opcache_invalidate(realpath($destPath) ?: $destPath, true);
                }
            }
        }
        if (function_exists('opcache_reset')) { opcache_reset(); }
        logStep($deployLog, 'rollback', "{$rolledBack} file ripristinati", 'ok');

        saveDeployLog($deployLog, $startTime, 'rolled_back', $installed, $filesToSkip, count($downloadFail));
        sendJsonResponse('rolled_back', 'Rollback eseguito', [
            'summary' => ['updated' => $installed, 'skipped' => $filesToSkip, 'failed' => count($downloadFail), 'rolled_back' => $rolledBack],
            'errors' => $downloadFail,
            'elapsed_ms' => elapsed($startTime)
        ]);
    }

    logStep($deployLog, 'health', 'Applicazione OK', 'ok');

    // ── Step 8: Salva stato ─────────────────────────────────────────────────

    $newState = $previousState;
    foreach ($downloaded as $entry) {
        $newState[$entry['path']] = $entry['hash'];
    }
    saveDeployState($newState);
    cleanDir(DEPLOY_TEMP_DIR);
    if (function_exists('opcache_reset')) { opcache_reset(); }

    saveDeployLog($deployLog, $startTime, 'ok', $installed, $filesToSkip, count($downloadFail));

    sendJsonResponse('ok', "Deploy completato: {$installed} aggiornati, {$filesToSkip} invariati", [
        'summary' => ['updated' => $installed, 'skipped' => $filesToSkip, 'failed' => count($downloadFail)],
        'errors' => $downloadFail,
        'commit_sha' => substr($latestCommitSha, 0, 8),
        'elapsed_ms' => elapsed($startTime)
    ]);

} catch (Throwable $e) {
    error_log("[Fusion-ERP][deploy_update.php] FATAL: " . $e->getMessage());
    cleanDir(DEPLOY_TEMP_DIR);
    saveDeployLog($deployLog, $startTime, 'error', 0, 0, 0, $e->getMessage());
    sendJsonResponse('error', $e->getMessage(), ['elapsed_ms' => elapsed($startTime)], 500);
}

// ═══════════════════════════════════════════════════════════════════════════════
// FUNZIONI HELPER
// ═══════════════════════════════════════════════════════════════════════════════

function sendJsonResponse(string $status, string $message, array $data = [], int $httpCode = 200): never
{
    http_response_code($httpCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(array_merge([
        'status' => $status, 'message' => $message, 'timestamp' => date('c'),
    ], $data), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function logStep(array &$log, string $step, string $message, string $status = 'running'): void
{
    $log[] = ['step' => $step, 'message' => $message, 'status' => $status, 'time' => date('c')];
}

function elapsed(float $start): int
{
    return (int) round((microtime(true) - $start) * 1000);
}

function fetchLatestCommitSha(string $repo, string $branch): string
{
    $url = "https://api.github.com/repos/{$repo}/commits/{$branch}";
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_USERAGENT => 'Fusion-ERP-Deploy/3.0', CURLOPT_TIMEOUT => 10,
    ]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200 || !$res) throw new RuntimeException("GitHub API non raggiungibile (HTTP {$code})");
    $data = json_decode($res, true);
    if (empty($data['sha'])) throw new RuntimeException("SHA non trovato");
    return $data['sha'];
}

function fetchManifest(string $repo, string $sha): array
{
    $url = "https://raw.githubusercontent.com/{$repo}/{$sha}/deploy_manifest.json";
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true, CURLOPT_SSL_VERIFYPEER => true, CURLOPT_TIMEOUT => 15,
    ]);
    $content = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($code !== 200 || !$content) throw new RuntimeException("Manifest non scaricabile (HTTP {$code})");
    $manifest = json_decode($content, true);
    if (!$manifest || !isset($manifest['files'])) throw new RuntimeException('Manifest non valido');
    return $manifest;
}

function downloadFileFromGitHub(string $repo, string $sha, string $path): string|false
{
    $encodedPath = implode('/', array_map('rawurlencode', explode('/', $path)));
    $url = "https://raw.githubusercontent.com/{$repo}/{$sha}/{$encodedPath}";
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url, CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true, CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'Fusion-ERP-Deploy/3.0', CURLOPT_TIMEOUT => 30,
    ]);
    $content = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ($code === 200 && $content !== false) ? $content : false;
}

function loadDeployState(): array
{
    if (!file_exists(DEPLOY_STATE_FILE)) return [];
    $data = json_decode(@file_get_contents(DEPLOY_STATE_FILE), true);
    return is_array($data) ? $data : [];
}

function saveDeployState(array $state): void
{
    file_put_contents(DEPLOY_STATE_FILE, json_encode($state, JSON_PRETTY_PRINT));
}

function saveDeployLog(array $steps, float $startTime, string $outcome, int $updated, int $skipped, int $failed, string $error = ''): void
{
    $entry = ['timestamp' => date('c'), 'outcome' => $outcome, 'elapsed_ms' => elapsed($startTime),
              'summary' => compact('updated', 'skipped', 'failed'), 'steps' => $steps];
    if ($error) $entry['error'] = $error;
    $existingLog = [];
    if (file_exists(DEPLOY_LOG_FILE)) $existingLog = json_decode(@file_get_contents(DEPLOY_LOG_FILE), true) ?: [];
    $existingLog[] = $entry;
    $existingLog = array_slice($existingLog, -20);
    @file_put_contents(DEPLOY_LOG_FILE, json_encode($existingLog, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function performHealthCheck(): bool
{
    // Prova ping.php first
    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http')
             . '://' . ($_SERVER['HTTP_HOST'] ?? 'localhost')
             . dirname($_SERVER['SCRIPT_NAME']);
    $pingUrl = $baseUrl . '/ping.php';

    $ch = curl_init();
    curl_setopt_array($ch, [CURLOPT_URL => $pingUrl, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
    $res = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $code === 200;
}

function cleanDir(string $dir): void
{
    if (!is_dir($dir)) return;
    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($items as $item) {
        $item->isDir() ? @rmdir($item->getRealPath()) : @unlink($item->getRealPath());
    }
    @rmdir($dir);
}
