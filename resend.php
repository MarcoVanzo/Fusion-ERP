<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/api/Shared/Database.php';
require_once __DIR__ . '/api/Shared/Mailer.php';
require_once __DIR__ . '/api/Modules/TalentDay/TalentDayController.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\Mailer;

$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

try {
    $db = Database::getInstance();
    
    // Get the most recent registration
    $stmt = $db->query("SELECT * FROM talent_day_entries ORDER BY id DESC LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) {
        die("Nessun dato trovato nel database.");
    }
    
    echo "Dati Recuperati:\n";
    print_r($row);
    
    $data = [
        'nome' => $row['nome'],
        'cognome' => $row['cognome'],
        'email' => $row['email'],
        'tappa' => $row['tappa'],
        'data_nascita' => $row['data_nascita'],
        'cellulare' => $row['cellulare'],
        'citta_cap' => $row['citta_cap'],
        'ruolo' => $row['ruolo'],
        'campionati' => $row['campionati'],
        'club_tesseramento' => $row['club_tesseramento'],
        'taglia_tshirt' => $row['taglia_tshirt']
    ];
    
    $controller = new \FusionERP\Modules\TalentDay\TalentDayController();
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('buildConfirmationEmail');
    $method->setAccessible(true);
    
    $htmlBody = $method->invokeArgs($controller, [$data]);
    
    $nome = htmlspecialchars(trim($data['nome']));
    $cognome = htmlspecialchars(trim($data['cognome']));
    $email = trim($data['email']);
    $subject = 'TEST FORZATO: Conferma Registrazione — Talent Day 2026 Savino Del Bene Volley';
    
    echo "\nInvio email all'atleta: $email\n";
    $sentAthlete = Mailer::sendWithAttachments(
        $email,
        "{$nome} {$cognome}",
        $subject,
        $htmlBody,
        '',
        [], // attachments placeholder
        [], // cc
        'giovanile@savinodelbenevolley.it', // fromEmail
        'Talent Day SDB'               // fromName
    );
    echo "Stato invio Atleta: " . ($sentAthlete ? 'SUCCESSO' : 'FALLITO') . "\n";
    
    $staffEmail = getenv('TALENT_DAY_STAFF_EMAIL') ?: 'giovanile@savinodelbenevolley.it';
    echo "\nInvio email copia Staff a: $staffEmail\n";
    $sentStaff = Mailer::send(
        $staffEmail,
        'Staff Talent Day SDB',
        "TEST [Nuova Registrazione] Talent Day — {$nome} {$cognome}",
        "<p>TEST Nuova registrazione Talent Day:</p><p><strong>{$nome} {$cognome}</strong><br>Tappa: {$row['tappa']}<br>Email: {$email}</p>",
        '',
        'giovanile@savinodelbenevolley.it', // fromEmail
        'Talent Day SDB'               // fromName
    );
    echo "Stato invio Staff: " . ($sentStaff ? 'SUCCESSO' : 'FALLITO') . "\n";
    
} catch (\Throwable $e) {
    echo "ERRORE PHP:\n";
    echo $e->getMessage() . " on line " . $e->getLine() . "\n";
}
