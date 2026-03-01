<?php
/**
 * update_athlete_address.php — One-shot: aggiorna indirizzo Ambra Stefan
 * Usage: https://www.fusionteamvolley.it/ERP/update_athlete_address.php?token=FUSION_UPDATE_ADDR_2526
 * DELETE THIS FILE AFTER USE!
 */

if (($_GET['token'] ?? '') !== 'FUSION_UPDATE_ADDR_2526') {
    http_response_code(403);
    die('Forbidden');
}

header('Content-Type: text/plain; charset=utf-8');

// Load .env
foreach (file(__DIR__ . '/.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
    if (str_starts_with(trim($line), '#') || !str_contains($line, '='))
        continue;
    [$k, $v] = explode('=', $line, 2);
    putenv(trim($k) . '=' . trim($v));
}

try {
    $dsn = 'mysql:host=' . getenv('DB_HOST') . ';port=' . (getenv('DB_PORT') ?: '3306') . ';dbname=' . getenv('DB_NAME') . ';charset=utf8mb4';
    $pdo = new PDO($dsn, getenv('DB_USER'), getenv('DB_PASS'), [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "✅ DB connected\n\n";

    // Mostra il record attuale prima dell'aggiornamento
    $check = $pdo->prepare("SELECT id, full_name, address FROM athletes WHERE id = 'ATH_3ca12ca31095'");
    $check->execute();
    $before = $check->fetch(PDO::FETCH_ASSOC);

    if (!$before) {
        echo "❌ Atleta ATH_3ca12ca31095 non trovata nel database.\n";
        exit;
    }

    echo "📋 Record attuale:\n";
    echo "   ID:       " . $before['id'] . "\n";
    echo "   Nome:     " . $before['full_name'] . "\n";
    echo "   Indirizzo: " . $before['address'] . "\n\n";

    // Aggiornamento
    $newAddress = 'Via Marche, 2, 30174 Venezia VE';
    $stmt = $pdo->prepare("UPDATE athletes SET address = ? WHERE id = 'ATH_3ca12ca31095'");
    $stmt->execute([$newAddress]);
    $affected = $stmt->rowCount();

    if ($affected > 0) {
        echo "✅ Indirizzo aggiornato con successo!\n";
        echo "   Nuovo indirizzo: " . $newAddress . "\n";
    }
    else {
        echo "⚠️ Nessuna riga aggiornata (indirizzo già corretto?).\n";
    }

    echo "\n⚠️ Elimina questo file!\n";
}
catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}