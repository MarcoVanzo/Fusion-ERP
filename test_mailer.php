<?php
require_once __DIR__ . '/vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

try {
    echo "Inizio test Mailer...\n";
    $result = \FusionERP\Shared\Mailer::send('test@example.com', 'Test', 'Oggetto', '<p>Test</p>');
    echo "Risultato: " . ($result ? 'Inviata' : 'Fallita') . "\n";
} catch (\Throwable $e) {
    echo "ERRORE FATALE: " . $e->getMessage() . " in " . $e->getFile() . ":" . $e->getLine() . "\n";
}
