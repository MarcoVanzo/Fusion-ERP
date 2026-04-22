<?php
/**
 * Fusion ERP — Deploy Update (HTTP Pull from GitHub)
 *
 * Questo endpoint viene chiamato dallo script di deploy locale.
 * Scarica i file dal repository GitHub pubblico usando il manifest.
 *
 * Autenticazione: Header X-Deploy-Key (confrontato con DEPLOY_KEY in .env)
 *
 * Flow:
 *   1. Verifica DEPLOY_KEY
 *   2. Scarica deploy_manifest.json da GitHub Raw
 *   3. Per ogni file nel manifest → scarica da raw.githubusercontent.com
 *   4. Applica cache busting (hash nei query string di index.html)
 *   5. Ritorna riepilogo (successi/errori)
 *
 * Uso:
 *   curl -s -H "X-Deploy-Key: <key>" https://www.fusionteamvolley.it/ERP/deploy_update.php
 */

declare(strict_types=1);

// ── Configurazione ──
$repo = 'MarcoVanzo/Fusion-ERP';
$branch = 'main';
$hashableExtensions = ['js', 'css'];

// ── Resolve DEPLOY_KEY ──
$deployKey = getenv('DEPLOY_KEY') ?: ($_ENV['DEPLOY_KEY'] ?? '');
if (!$deployKey) {
    // Fallback: parse .env direttamente
    $envPaths = [__DIR__ . '/.env', __DIR__ . '/../.env'];
    foreach ($envPaths as $envPath) {
        $envContent = @file_get_contents($envPath);
        if ($envContent && preg_match('/DEPLOY_KEY\s*=\s*([^\r\n]+)/', $envContent, $matches)) {
            $deployKey = trim($matches[1], '"\'  ');
            break;
        }
    }
}

// ── Verifica autenticazione ──
$providedKey = $_SERVER['HTTP_X_DEPLOY_KEY'] ?? '';

if (empty($deployKey)) {
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo "<pre>❌ DEPLOY_KEY non trovata nel sistema.\nConfigurala nel file .env sul server.</pre>";
    exit;
}

if (!hash_equals(trim($deployKey), trim($providedKey))) {
    http_response_code(403);
    header('Content-Type: text/html; charset=utf-8');
    echo "<pre>⛔ Accesso Negato\n";
    echo "La chiave fornita non coincide o è mancante.\n";
    echo "Uso: Header X-Deploy-Key\n</pre>";
    exit;
}

// ── Timeout esteso per deploy lunghi ──
set_time_limit(300);
ini_set('max_execution_time', '300');

header('Content-Type: text/html; charset=utf-8');
echo "<pre>\n";
echo "══════════════════════════════════════════════════════\n";
echo "  🚀 Fusion ERP — Deploy Update (HTTP Pull)\n";
echo "══════════════════════════════════════════════════════\n\n";

// ── Step 1: Ottieni ultimo commit SHA ──
echo "📡 Recupero ultimo commit da GitHub...\n";
$apiUrl = "https://api.github.com/repos/$repo/commits/$branch";
$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => 'Fusion-ERP-Deploy/1.0',
    CURLOPT_TIMEOUT => 15,
]);
$commitData = curl_exec($ch);
$commitHttp = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($commitHttp !== 200 || !$commitData) {
    echo "❌ Impossibile ottenere ultimo commit (HTTP $commitHttp)\n</pre>";
    exit(1);
}

$commitInfo = json_decode($commitData, true);
$latestCommitSha = $commitInfo['sha'] ?? $branch;
echo "✅ Ultimo commit: " . substr($latestCommitSha, 0, 8) . "\n\n";

// ── Step 2: Scarica il manifest ──
echo "📋 Scaricamento manifest...\n";
$manifestUrl = "https://raw.githubusercontent.com/$repo/$latestCommitSha/deploy_manifest.json?t=" . time();
$ch = curl_init($manifestUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_USERAGENT => 'Fusion-ERP-Deploy/1.0',
    CURLOPT_TIMEOUT => 15,
]);
$manifestContent = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200 || !$manifestContent) {
    echo "❌ Impossibile scaricare il manifest (HTTP $httpCode)\n</pre>";
    exit(1);
}

$files = json_decode($manifestContent, true);
if (!is_array($files) || empty($files)) {
    echo "❌ Manifest vuoto o non valido.\n</pre>";
    exit(1);
}

echo "✅ Manifest caricato (" . count($files) . " file identificati)\n\n";

// ── Step 3: Scarica e aggiorna i file ──
echo "📦 Download e aggiornamento file...\n";
echo "────────────────────────────────────────────────────\n";

$successCount = 0;
$failCount = 0;
$totalBytes = 0;
$hashes = [];

foreach ($files as $file) {
    // Encode path components for URL (handles spaces, special chars)
    $encodedFile = implode('/', array_map('rawurlencode', explode('/', $file)));
    $url = "https://raw.githubusercontent.com/$repo/$latestCommitSha/$encodedFile";

    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'Fusion-ERP-Deploy/1.0',
        CURLOPT_TIMEOUT => 30,
    ]);
    $content = curl_exec($ch);
    $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($content !== false && $httpCode === 200) {
        // Crea directory se necessario
        $dir = dirname($file);
        if ($dir !== '.' && !is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Scrivi il file
        if (@file_put_contents($file, $content) === false) {
            $failCount++;
            echo "❌ $file (Errore scrittura — permessi?)\n";
            continue;
        }

        $size = strlen($content);
        $totalBytes += $size;
        $successCount++;

        // Calcola hash per file JS/CSS (usato per cache busting)
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        if (in_array($ext, $hashableExtensions)) {
            $hash = substr(md5($content), 0, 8);
            $hashes[$file] = $hash;
            echo "✅ $file [$hash]\n";
        } else {
            echo "✅ $file\n";
        }

        // Invalida opcache per file PHP
        if ($ext === 'php' && function_exists('opcache_invalidate')) {
            opcache_invalidate(realpath($file) ?: $file, true);
        }
    } else {
        $failCount++;
        echo "❌ $file (HTTP $httpCode)\n";
    }
}

echo "────────────────────────────────────────────────────\n\n";

// ── Step 4: Cache Busting ──
if (!empty($hashes) && file_exists('index.html')) {
    echo "🔄 Applicazione cache busting...\n";
    $indexContent = file_get_contents('index.html');
    $bustCount = 0;

    foreach ($hashes as $filePath => $hash) {
        $basename = basename($filePath);
        // Replace ?v=... with new hash
        $pattern = '/' . preg_quote($basename, '/') . '\?v=[a-zA-Z0-9._]+/';
        $replacement = $basename . '?v=' . $hash;
        $newContent = preg_replace($pattern, $replacement, $indexContent);
        if ($newContent !== $indexContent) {
            $indexContent = $newContent;
            $bustCount++;
        }
    }

    // Update app-version meta tag
    $timestamp = time();
    $indexContent = preg_replace(
        '/(<meta name="app-version" content=")[^"]+(")/i',
        '${1}' . $timestamp . '${2}',
        $indexContent
    );

    file_put_contents('index.html', $indexContent);
    echo "✅ Cache busting applicato ($bustCount file, v=$timestamp)\n\n";
}

// ── Riepilogo ──
$totalMB = number_format($totalBytes / 1024 / 1024, 2);
echo "══════════════════════════════════════════════════════\n";
echo "📊 Riepilogo: $successCount OK, $failCount falliti ($totalMB MB)\n";
echo "══════════════════════════════════════════════════════\n";

if ($failCount === 0) {
    echo "\n✅ Deploy completato senza errori!\n";
} else {
    echo "\n⚠️  Deploy completato con $failCount errori. Controlla i file falliti.\n";
}

echo "\n→ https://www.fusionteamvolley.it/ERP/\n";
echo "</pre>";
