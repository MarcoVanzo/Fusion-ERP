<?php
// FederVolley API diagnostic - DELETE AFTER USE
header('Content-Type: text/plain; charset=utf-8');

$url = $_GET['url'] ?? 'https://www.federvolley.it/live-score-b2-femminile?girone=D';

echo "=== FederVolley API Diagnostic ===\n\n";
echo "Input URL: $url\n\n";

// --- Parse URL ---
$path = strtolower(parse_url($url, PHP_URL_PATH) ?? '');
$qs = parse_url($url, PHP_URL_QUERY) ?? '';
parse_str($qs, $qsParsed);
$girone = strtoupper(trim($qsParsed['girone'] ?? ''));

echo "Path: $path\n";
echo "QS girone: $girone\n";

// Serie detection
$serie = null;
$serieMap = ['b2' => 'B2', 'b1' => 'B1', 'a1' => 'A1', 'a2' => 'A2', 'serie-b2' => 'B2'];
foreach ($serieMap as $slug => $code) {
    if (str_contains($path, $slug)) {
        $serie = $code;
        break;
    }
}
echo "Serie: " . ($serie ?? 'NOT DETECTED') . "\n";

$sesso = str_contains($path, 'femmin') ? 'F' : (str_contains($path, 'maschil') ? 'M' : 'F');
echo "Sesso: $sesso\n";

$month = (int)date('n');
$year = (int)date('Y');
$stagione = ($month <= 7) ? (string)($year - 1) : (string)$year;
echo "Stagione (computed): $stagione (month=$month, year=$year)\n\n";

if (!$serie) {
    echo "ERROR: cannot detect serie from URL\n";
    exit;
}

// --- Fetch function ---
function fv_fetch(string $url): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 15,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; FusionERP/1.0)',
        CURLOPT_HTTPHEADER => ['Accept: application/json'],
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $body = curl_exec($ch);
    $err = curl_error($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['body' => $body, 'err' => $err, 'code' => $code];
}

// --- Test 1: giornate ---
$giornateUrl = "https://www.federvolley.it/live_score/giornate/{$serie}/{$sesso}/{$stagione}/{$girone}";
echo "--- Test 1: Giornate ---\n";
echo "URL: $giornateUrl\n";
$r = fv_fetch($giornateUrl);
echo "HTTP: {$r['code']} | Error: {$r['err']}\n";
echo "Body (first 300): " . substr($r['body'] ?: '(empty)', 0, 300) . "\n\n";

$giornateData = $r['body'] ? json_decode($r['body'], true) : null;
if ($giornateData) {
    echo "  ultimagiornata: " . ($giornateData['ultimagiornata'] ?? 'null') . "\n";
    echo "  giornate count: " . count($giornateData['giornate'] ?? []) . "\n";
}

// --- Test 2: one match round ---
$ultima = (int)($giornateData['ultimagiornata'] ?? 1);
$calUrl = "https://www.federvolley.it/live_score/live-score-calendario/{$serie}/{$sesso}/{$stagione}/{$girone}/{$ultima}";
echo "\n--- Test 2: Calendario giornata {$ultima} ---\n";
echo "URL: $calUrl\n";
$r2 = fv_fetch($calUrl);
echo "HTTP: {$r2['code']} | Error: {$r2['err']}\n";
echo "Body (first 800):\n" . substr($r2['body'] ?: '(empty)', 0, 800) . "\n\n";

$calData = $r2['body'] ? json_decode($r2['body'], true) : null;
if ($calData) {
    $rows = $calData['calendario'] ?? (isset($calData[0]) ? $calData : []);
    echo "  rows count: " . count($rows) . "\n";
    if (!empty($rows)) {
        $m = $rows[0];
        echo "  first match keys: " . implode(', ', array_keys($m)) . "\n";
        echo "  squadraA: " . json_encode($m['squadraA'] ?? null) . "\n";
        echo "  squadraB: " . json_encode($m['squadraB'] ?? null) . "\n";
        echo "  risultato: " . json_encode($m['risultato'] ?? null) . "\n";
        echo "  data_gara_short: " . ($m['data_gara_short'] ?? 'null') . "\n";
        echo "  ora_gara: " . ($m['ora_gara'] ?? 'null') . "\n";
    }
}

// --- Test 3: Classifica ---
$clasUrl = "https://www.federvolley.it/moduli/campionati/classifica/classifica.php"
    . "?serie={$serie}&sesso={$sesso}&stagione={$stagione}&giornata={$ultima}&girone={$girone}";
echo "\n--- Test 3: Classifica ---\n";
echo "URL: $clasUrl\n";
$r3 = fv_fetch($clasUrl);
echo "HTTP: {$r3['code']} | Error: {$r3['err']}\n";
echo "Body (first 400): " . substr($r3['body'] ?: '(empty)', 0, 400) . "\n";

echo "\n=== Done ===\n";