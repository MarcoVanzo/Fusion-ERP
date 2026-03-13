<?php
/**
 * VALD ENV PATCH — scrive le credenziali VALD nel .env sul server.
 * ELIMINARE IMMEDIATAMENTE DOPO L'USO.
 */
header('Content-Type: text/plain; charset=utf-8');

$envPath = __DIR__ . '/.env';

// Leggi il .env attuale
$content = file_get_contents($envPath);
if ($content === false) {
    echo "ERRORE: impossibile leggere $envPath\n";
    exit;
}

echo "Righe attuali: " . count(explode("\n", $content)) . "\n";

// Rimuovi eventuali righe VALD già presenti (vuote o piene)
$lines = explode("\n", $content);
$filtered = array_filter($lines, function($line) {
    return strpos(trim($line), 'VALD_') !== 0;
});
$newContent = implode("\n", $filtered);

// Aggiungi le credenziali VALD corrette
$valdBlock = "\n\n# --- VALD ForceDecks API ---\n"
    . "VALD_CLIENT_ID=M8P861J18q9Aw2HLtCuMszB31z03VYnE\n"
    . "VALD_CLIENT_SECRET=qfQYsxr58z76bLZ1XgNIHuXotRvqfj4Q-zTY1vuybhokVTYwI2VUf4leAX0ircIW\n"
    . "VALD_USER_EMAIL=marco@mv-consulting.it\n"
    . "VALD_ORG_ID=520b0e3c-60da-48c5-a756-3da0bc5dcfb1\n";

$newContent .= $valdBlock;

// Scrivi il file aggiornato
$result = file_put_contents($envPath, $newContent);
if ($result === false) {
    echo "ERRORE: impossibile scrivere in $envPath — verificare i permessi.\n";
    exit;
}

echo "OK: .env aggiornato ($result bytes scritti).\n";
echo "Righe ora: " . count(explode("\n", $newContent)) . "\n\n";

// Verifica immediata
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createUnsafeImmutable(__DIR__);
$dotenv->safeLoad();

$clientId = getenv('VALD_CLIENT_ID') ?: '(vuoto)';
$orgId    = getenv('VALD_ORG_ID')    ?: '(vuoto)';
echo "VALD_CLIENT_ID dopo patch : " . (strlen($clientId) > 5 ? substr($clientId, 0, 6) . '...' : $clientId) . "\n";
echo "VALD_ORG_ID    dopo patch : $orgId\n";
