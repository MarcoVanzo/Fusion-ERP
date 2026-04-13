<?php
require_once __DIR__ . '/vendor/autoload.php';

use FusionERP\Shared\Database;
use FusionERP\Shared\Mailer;

// Load environment
$dotenv = Dotenv\Dotenv::createMutable(__DIR__);
$dotenv->safeLoad();

try {
    $db = Database::getConnection();
    
    // Get the most recent registration
    $stmt = $db->query("SELECT * FROM talent_day_entries ORDER BY id DESC LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$row) {
        die("No rows found in talent_day_entries.\n");
    }
    
    print_r($row);
    
    // Reconstruct data array to match what form would send
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
    
    // Since buildConfirmationEmail is private in TalentDayController, we'll use Reflection to access it
    $controller = new \FusionERP\Modules\TalentDay\TalentDayController();
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('buildConfirmationEmail');
    $method->setAccessible(true);
    
    $htmlBody = $method->invokeArgs($controller, [$data]);
    
    $nome = htmlspecialchars(trim($data['nome']));
    $cognome = htmlspecialchars(trim($data['cognome']));
    $email = trim($data['email']);
    $subject = 'TEST Conferma Registrazione — Talent Day 2026 Savino Del Bene Volley';
    
    echo "Sending email to: $email\n";
    
    $sentAthlete = Mailer::sendWithAttachments(
        $email,
        "{$nome} {$cognome}",
        $subject,
        $htmlBody,
        '',
        [], // attachments
        [], // cc
        'giovanile@savinodelbenevolley.it', // fromEmail (mapped to replyTo now)
        'Talent Day SDB'               // fromName
    );
    
    echo "Athlete Email Sent: " . ($sentAthlete ? 'SUCCESS' : 'FAILED') . "\n";
    
    $staffEmail = getenv('TALENT_DAY_STAFF_EMAIL') ?: 'giovanile@savinodelbenevolley.it';
    echo "Sending staff copy to: $staffEmail\n";
    
    $sentStaff = Mailer::send(
        $staffEmail,
        'Staff Talent Day SDB',
        "TEST [Nuova Registrazione] Talent Day — {$nome} {$cognome}",
        "<p>TEST Nuova registrazione Talent Day:</p><p><strong>{$nome} {$cognome}</strong><br>Tappa: {$row['tappa']}<br>Email: {$email}</p>",
        '',
        'giovanile@savinodelbenevolley.it', // fromEmail (mapped to replyTo now)
        'Talent Day SDB'               // fromName
    );
    
    echo "Staff Email Sent: " . ($sentStaff ? 'SUCCESS' : 'FAILED') . "\n";
    
} catch (\Throwable $e) {
    echo "ERROR: " . $e->getMessage() . " on line " . $e->getLine() . "\n";
}
