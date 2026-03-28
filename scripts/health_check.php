<?php

/**
 * Health Check Script - Dynamic Validation of Public APIs
 */

$port = 8081;
$host = "127.0.0.1";
$baseUrl = "http://$host:$port/api/router.php";

// 1. Avvia server PHP integrato in background
echo "🚀 Avvio server di test su $host:$port...\n";
$descriptorspec = [
    0 => ["pipe", "r"], // stdin
    1 => ["file", __DIR__ . "/../tmp/server_stdout.log", "a"], // stdout
    2 => ["file", __DIR__ . "/../tmp/server_stderr.log", "a"]  // stderr
];
$process = proc_open("php -S $host:$port", $descriptorspec, $pipes, __DIR__ . "/..");

if (!is_resource($process)) {
    die("❌ Impossibile avviare il server PHP.\n");
}

// Attendi un attimo che il server sia pronto
sleep(2);

$publicEndpoints = [
    ['module' => 'athletes', 'action' => 'getPublicTeams'],
    ['module' => 'website',  'action' => 'getPublicNews'],
    ['module' => 'societa',  'action' => 'getPublicSponsors'],
    ['module' => 'staff',    'action' => 'getPublicStaff'],
    ['module' => 'results',  'action' => 'getPublicRecentResults']
];

$results = [];

echo "🧪 Esecuzione test dinamici su API pubbliche...\n\n";
echo str_pad("MODULE", 15) . " | " . str_pad("ACTION", 25) . " | " . "STATUS\n";
echo str_repeat("-", 60) . "\n";

foreach ($publicEndpoints as $ep) {
    $url = $baseUrl . "?module=" . $ep['module'] . "&action=" . $ep['action'];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $statusText = ($httpCode === 200) ? "✅ 200 OK" : "❌ $httpCode FAIL";
    
    echo str_pad($ep['module'], 15) . " | " . str_pad($ep['action'], 25) . " | " . $statusText . "\n";
    
    $results[] = [
        'module' => $ep['module'],
        'action' => $ep['action'],
        'code' => $httpCode,
        'response' => json_decode($response, true)
    ];
}

echo "\n🛑 Arresto server di test...\n";
proc_terminate($process);

echo "\n=== CONCLUSIONE HEALTH CHECK ===\n";
$successCount = count(array_filter($results, fn($r) => $r['code'] === 200));
echo "Totale Testati: " . count($results) . "\n";
echo "Successi: $successCount\n";
echo "Fallimenti: " . (count($results) - $successCount) . "\n";

if ($successCount < count($results)) {
    echo "⚠️ Alcune API pubbliche hanno riportato errori. Controllare i log del database/ambiente.\n";
} else {
    echo "🎉 Tutte le API pubbliche testate funzionano correttamente!\n";
}
