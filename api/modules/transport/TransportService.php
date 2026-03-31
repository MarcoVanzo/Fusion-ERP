<?php
/**
 * Transport Service — Handles PDF, Mail, AI analysis, and business rules for Transport module.
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Transport;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\AIService;
use Mpdf\Mpdf;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailerException;

class TransportService
{
    private TransportRepository $repo;

    public function __construct()
    {
        $this->repo = new TransportRepository();
    }

    // ─── EVENTS ───────────────────────────────────────────────────────────────

    public function createEvent(array $user, array $body): array
    {
        Response::requireFields($body, ['team_id', 'type', 'title', 'event_date']);

        $id = 'EVT_' . bin2hex(random_bytes(4));
        $this->repo->createEvent([
            ':id' => $id,
            ':team_id' => $body['team_id'],
            ':type' => $body['type'],
            ':title' => htmlspecialchars(trim($body['title']), ENT_QUOTES, 'UTF-8'),
            ':event_date' => $body['event_date'],
            ':event_end' => $body['event_end'] ?? null,
            ':location_name' => $body['location_name'] ?? null,
            ':location_lat' => isset($body['location_lat']) ? (float)$body['location_lat'] : null,
            ':location_lng' => isset($body['location_lng']) ? (float)$body['location_lng'] : null,
            ':status' => 'scheduled',
            ':notes' => $body['notes'] ?? null,
            ':created_by' => $user['id'],
        ]);

        Audit::log('INSERT', 'events', $id, null, $body);
        return ['id' => $id];
    }

    public function cancelEvent(string $id): array
    {
        $before = $this->repo->getEventById($id);
        if (!$before) {
            throw new \Exception('Evento non trovato', 404);
        }
        $this->repo->updateEventStatus($id, 'cancelled');
        Audit::log('UPDATE', 'events', $id, $before, ['status' => 'cancelled']);
        return ['message' => 'Evento annullato'];
    }

    // ─── CARPOOL ROUTES ───────────────────────────────────────────────────────

    public function createRoute(array $user, array $body): array
    {
        Response::requireFields($body, ['event_id', 'seats_total']);

        $seatsTotal = max(2, (int)$body['seats_total']);
        $id = 'CAR_' . bin2hex(random_bytes(4));

        $this->repo->createRoute([
            ':id' => $id,
            ':event_id' => $body['event_id'],
            ':driver_user_id' => $user['id'],
            ':meeting_point_name' => $body['meeting_point_name'] ?? null,
            ':meeting_point_lat' => $body['meeting_point_lat'] ?? null,
            ':meeting_point_lng' => $body['meeting_point_lng'] ?? null,
            ':departure_time' => $body['departure_time'] ?? null,
            ':seats_total' => $seatsTotal,
            ':seats_available' => $seatsTotal - 1, // 1 seat is the driver
            ':notes' => $body['notes'] ?? null,
        ]);

        Audit::log('INSERT', 'carpool_routes', $id, null, $body);
        return ['id' => $id];
    }

    // ─── PASSENGERS ───────────────────────────────────────────────────────────

    public function addPassenger(array $user, array $body): array
    {
        Response::requireFields($body, ['route_id', 'athlete_id']);

        $route = $this->repo->getRouteById($body['route_id']);
        if (!$route) {
            throw new \Exception('Tratta non trovata', 404);
        }
        if ($route['seats_available'] <= 0) {
            throw new \Exception('Nessun posto disponibile', 409);
        }

        $this->repo->addPassenger([
            ':route_id' => $body['route_id'],
            ':athlete_id' => $body['athlete_id'],
            ':requested_by' => $user['id'],
            ':pickup_lat' => $body['pickup_lat'] ?? null,
            ':pickup_lng' => $body['pickup_lng'] ?? null,
            ':pickup_address' => $body['pickup_address'] ?? null,
        ]);

        Audit::log('INSERT', 'carpool_passengers', $body['route_id'], null, $body);
        return ['message' => 'Richiesta passaggio inviata'];
    }

    public function confirmPassenger(int $passId, string $routeId): array
    {
        $db = \FusionERP\Shared\Database::getInstance();
        $db->beginTransaction();
        try {
            $this->repo->confirmPassenger($passId);
            $affected = $this->repo->decrementSeatsAtomic($routeId);
            if ($affected === 0) {
                $db->rollBack();
                throw new \Exception('Nessun posto disponibile — la conferma è stata annullata.', 409);
            }
            $db->commit();
        }
        catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        Audit::log('UPDATE', 'carpool_passengers', (string)$passId, null, ['status' => 'confirmed']);
        return ['message' => 'Passeggero confermato'];
    }

    // ─── REIMBURSEMENTS ───────────────────────────────────────────────────────

    public function generateReimbursement(array $user, array $body): array
    {
        Response::requireFields($body, ['carpoolId', 'distanceKm']);

        // Idempotency check 
        $existing = $this->repo->getReimbursementByCarpool($body['carpoolId']);
        if ($existing) {
            return [
                'id' => $existing['id'],
                'total_eur' => (float)$existing['total_eur'],
                'pdf_path' => $existing['pdf_path'] ?? null,
                'message' => 'Rimborso già esistente per questa tratta.',
            ];
        }

        $km = (float)$body['distanceKm'];
        $rate = (float)(getenv('MILEAGE_RATE') ?: 0.25);
        $total = round($km * $rate, 2);
        $reimbId = 'MIL_' . bin2hex(random_bytes(4));

        $this->repo->createReimbursement([
            ':id' => $reimbId,
            ':carpool_id' => $body['carpoolId'],
            ':user_id' => $user['id'],
            ':distance_km' => $km,
            ':rate_eur_km' => $rate,
            ':total_eur' => $total,
        ]);

        // Generate PDF
        $pdfPath = $this->generateReimbursementPdf($reimbId, $user, $body, $km, $rate, $total);
        if ($pdfPath) {
            $this->repo->updateReimbursementPdf($reimbId, $pdfPath);
        }

        Audit::log('INSERT', 'mileage_reimbursements', $reimbId, null, $body);
        return [
            'id' => $reimbId, 
            'total_eur' => $total, 
            'pdf_path' => $pdfPath
        ];
    }

    private function generateReimbursementPdf(
        string $reimbId, array $user, array $body, float $km, float $rate, float $total
    ): ?string
    {
        try {
            $mpdf = new Mpdf([
                'mode' => 'utf-8',
                'format' => 'A4',
                'margin_top' => 20, 'margin_bottom' => 20,
                'margin_left' => 20, 'margin_right' => 20,
            ]);

            $date = date('d/m/Y');
            $kmStr = number_format($km, 2, ',', '');
            $rateStr = number_format($rate, 2, ',', '');
            $totalStr = number_format($total, 2, ',', '');

            $html = <<<HTML
<style>
  body { font-family: Arial, sans-serif; color: #000; }
  h1 { font-size: 22px; text-transform: uppercase; letter-spacing: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  td, th { border: 1px solid #000; padding: 10px; font-size: 13px; }
  th { background: #000; color: #fff; text-transform: uppercase; }
  .total { font-weight: bold; font-size: 16px; }
</style>
<h1>Nota Spese Rimborso Chilometrico</h1>
<p><strong>Fusion ERP</strong> — Data: {$date}</p>
<table>
  <tr><th>Collaboratore</th><th>ID Tratta</th><th>Km Percorsi</th><th>Tariffa €/km</th><th>Totale</th></tr>
  <tr>
    <td>{$user['fullName']}</td>
    <td>{$body['carpoolId']}</td>
    <td>{$kmStr}</td>
    <td>€ {$rateStr}</td>
    <td class="total">€ {$totalStr}</td>
  </tr>
</table>
<p style="margin-top:30px;">Firma allenatore: ________________________________</p>
HTML;

            $mpdf->WriteHTML($html);
            $storagePath = getenv('PDF_STORAGE_PATH') ?: '/tmp/';
            $filename = "rimborso_{$reimbId}_" . date('Ymd') . '.pdf';
            $fullPath = rtrim($storagePath, '/') . '/' . $filename;
            $mpdf->Output($fullPath, 'F');
            return $filename;
        }
        catch (\Throwable $e) {
            error_log('[PDF] Reimbursement generation failed: ' . $e->getMessage());
            return null;
        }
    }

    // ─── EMAIL CONVOCATIONS ───────────────────────────────────────────────────

    public function sendConvocations(string $eventId): array
    {
        $event = $this->repo->getEventById($eventId);
        if (!$event) {
            throw new \Exception('Evento non trovato', 404);
        }

        $attendees = $this->repo->getAttendeesWithContacts($eventId);
        $sent = 0;
        $failed = 0;

        foreach ($attendees as $att) {
            $email = $att['user_email'] ?? null;
            if (empty($email)) {
                continue;
            }

            $ok = $this->sendEmail(
                $email,
                "Convocazione: {$event['title']}",
                $this->buildConvocationEmail($att, $event)
            );

            $this->repo->logEmail([
                ':event_id' => $eventId,
                ':recipient' => $email,
                ':subject' => "Convocazione: {$event['title']}",
                ':type' => 'convocation',
                ':status' => $ok ? 'sent' : 'failed',
                ':sent_at' => $ok ? date('Y-m-d H:i:s') : null,
                ':error_msg' => null,
            ]);

            $ok ? $sent++ : $failed++;
        }

        Audit::log('EMAIL_SENT', 'events', $eventId, null, ['sent' => $sent, 'failed' => $failed]);
        return ['sent' => $sent, 'failed' => $failed];
    }

    private function buildConvocationEmail(array $att, array $event): string
    {
        $date = date('d/m/Y H:i', strtotime($event['event_date']));
        return <<<HTML
<div style="font-family:Arial,sans-serif;max-width:600px;">
  <h2 style="background:#000;color:#E6007E;padding:20px;margin:0;text-transform:uppercase">
    CONVOCAZIONE
  </h2>
  <div style="padding:20px;border:1px solid #e5e5e5;">
    <p>Ciao <strong>{$att['user_name']}</strong>,</p>
    <p>Ti comunichiamo la seguente convocazione:</p>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Evento</td><td style="padding:8px;border-bottom:1px solid #eee;">{$event['title']}</td></tr>
      <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Data</td><td style="padding:8px;border-bottom:1px solid #eee;">{$date}</td></tr>
      <tr><td style="padding:8px;font-weight:bold;">Luogo</td><td style="padding:8px;">{$event['location_name']}</td></tr>
    </table>
    <p style="margin-top:20px;font-size:12px;color:#666;">Fusion ERP — Sistema di gestione sportiva</p>
  </div>
</div>
HTML;
    }

    private function sendEmail(string $to, string $subject, string $htmlBody): bool
    {
        try {
            $mail = new PHPMailer(true);
            $mail->isSMTP();
            $mail->Host = getenv('SMTP_HOST') ?: 'localhost';
            $mail->SMTPAuth = true;
            $mail->Username = getenv('SMTP_USER') ?: '';
            $mail->Password = getenv('SMTP_PASS') ?: '';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = (int)(getenv('SMTP_PORT') ?: 587);
            $mail->CharSet = 'UTF-8';

            $fromName = getenv('SMTP_FROM_NAME') ?: 'Fusion ERP';
            $fromAddr = getenv('SMTP_USER') ?: 'noreply@fusionerp.it';
            $mail->setFrom($fromAddr, $fromName);
            $mail->addAddress($to);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $htmlBody;
            $mail->AltBody = strip_tags($htmlBody);
            $mail->send();
            return true;
        }
        catch (MailerException $e) {
            error_log('[MAILER] Failed to send to ' . $to . ': ' . $e->getMessage());
            return false;
        }
    }

    // ─── AI ANALYSIS ─────────────────────────────────────────────────────────

    public function analyzeTransportAI(array $body): array
    {
        $transportId = $body['transportId'] ?? '';
        $isPreview = !empty($body['previewData']);

        if ($isPreview) {
            $preview = $body['previewData'];
            $transport = [
                'destination_name'    => $preview['destination_name'] ?? 'Destinazione Sconosciuta',
                'destination_address' => $preview['destination_address'] ?? 'N/A',
                'departure_address'   => $preview['departure_address'] ?? 'N/A',
                'transport_date'      => $preview['transport_date'] ?? 'N/A',
                'arrival_time'        => $preview['arrival_time'] ?? 'N/A',
            ];
            $timeline = $preview['timeline'] ?? [];
            $athletes = $preview['athletes'] ?? [];
            $stats    = $preview['stats'] ?? [];
        } else {
            $transportRow = $this->repo->getTransportById($transportId);
            if (!$transportRow) {
                throw new \Exception('Trasporto non trovato', 404);
            }
            $transport = $transportRow;
            $timeline = json_decode($transportRow['timeline_json'] ?? '[]', true) ?: [];
            $athletes = json_decode($transportRow['athletes_json'] ?? '[]', true) ?: [];
            $stats    = json_decode($transportRow['stats_json'] ?? '{}', true) ?: [];
        }

        // Build readable route description for the AI
        $stopDescriptions = [];
        foreach ($timeline as $i => $stop) {
            $tipo   = $stop['tipo'] ?? 'sconosciuto';
            $luogo  = $stop['luogo'] ?? 'N/A';
            $orario = $stop['orario'] ?? '';
            $nota   = $stop['nota'] ?? '';
            $lat    = $stop['coord']['lat'] ?? null;
            $lng    = $stop['coord']['lng'] ?? null;
            $coordStr = ($lat && $lng) ? " (lat: {$lat}, lng: {$lng})" : '';
            $stopDescriptions[] = "Tappa {$i}: [{$tipo}] {$luogo}{$coordStr} — ore {$orario} — {$nota}";
        }

        $athleteDescriptions = [];
        foreach ($athletes as $ath) {
            $name    = $ath['name'] ?? $ath['full_name'] ?? 'N/A';
            $address = $ath['address'] ?? 'indirizzo sconosciuto';
            $athleteDescriptions[] = "- {$name}: {$address}";
        }

        $prompt = "Sei un esperto di logistica sportiva. Analizza il seguente viaggio di trasporto e suggerisci se alcune tappe di raccolta possono essere accorpate in PUNTI DI RACCOLTA comuni per ottimizzare il percorso.\n\n";
        $prompt .= "DESTINAZIONE: {$transport['destination_name']} ({$transport['destination_address']})\n";
        $prompt .= "PARTENZA: {$transport['departure_address']}\n";
        $prompt .= "DATA: {$transport['transport_date']}\n";
        $prompt .= "ORARIO ARRIVO: {$transport['arrival_time']}\n";
        $prompt .= "DURATA TOTALE: " . ($stats['durata'] ?? 'N/A') . "\n";
        $prompt .= "DISTANZA TOTALE: " . ($stats['distanza'] ?? 'N/A') . "\n\n";
        $prompt .= "TAPPE DEL PERCORSO:\n" . implode("\n", $stopDescriptions) . "\n\n";
        $prompt .= "ATLETE E INDIRIZZI:\n" . implode("\n", $athleteDescriptions) . "\n\n";

        $prompt .= "Analizza il percorso e rispondi ESCLUSIVAMENTE in JSON valido con questa struttura. Se ritieni utile suddividere il trasporto in più viaggi (es. due pulmini separati) per ottimizzare la logistica, compila l'array 'viaggi_multipli'. Per le atlete fuori percorso, NON escluderle, ma proponi SEMPRE un punto di ritrovo intermedio ragionevole.\n";
        $prompt .= "{\n";
        $prompt .= "  \"consigli\": \"Testo con i consigli generali sull'ottimizzazione del percorso\",\n";
        $prompt .= "  \"viaggi_multipli\": [\n";
        $prompt .= "    { \"nome_viaggio\": \"Nome descrittivo (es. Pulmino Nord)\", \"atlete\": [\"Nome atleta 1\"], \"motivo\": \"Perché conviene questo viaggio separato\" }\n";
        $prompt .= "  ],\n";
        $prompt .= "  \"punti_raccolta\": [\n";
        $prompt .= "    { \"nome\": \"Nome del punto di raccolta suggerito\", \"indirizzo\": \"Indirizzo del punto\", \"atlete\": [\"Nome atleta 1\", \"Nome atleta 2\"], \"motivo\": \"Perché questo punto è ottimale\" }\n";
        $prompt .= "  ],\n";
        $prompt .= "  \"fuori_percorso\": [\n";
        $prompt .= "    { \"nome\": \"Nome atleta\", \"motivo\": \"Perché è fuori dal percorso ottimale\", \"punto_ritrovo_consigliato\": \"Indirizzo del punto di incontro alternativo suggerito\" }\n";
        $prompt .= "  ],\n";
        $prompt .= "  \"risparmio_stimato\": \"Stima del tempo/distanza risparmiato con le modifiche suggerite\"\n";
        $prompt .= "}\n\n";
        $prompt .= "REGOLE:\n";
        $prompt .= "- NESSUNA ATLETA PUÒ ESSERE ELIMINATA DAL SERVIZIO. Tutti i nomi forniti in input devono essere gestiti.\n";
        $prompt .= "- Se una ragazza è scomoda, dalle un punto di ritrovo in 'punto_ritrovo_consigliato'. Se è troppo lontana anche per un ritrovo, DEVI OBBLIGATORIAMENTE creare un viaggio dedicato per lei in 'viaggi_multipli'.\n";
        $prompt .= "- IMPORTANTE: Ogni nuovo punto di raccolta e ogni punto di ritrovo suggerito DEVE trovarsi al massimo a 5 km dall'indirizzo originale dell'atleta o dal percorso.\n";
        $prompt .= "- Suggerisci 'viaggi_multipli' solo se ha senso usare più di un furgone.\n";
        $prompt .= "- Se due o più atlete abitano vicine, suggerisci un punto di raccolta comune (parcheggio, piazza, incrocio noto), sempre entro il limite dei 5 km.\n";
        $prompt .= "- Considera la viabilità e la facilità di accesso dei punti suggeriti.\n";
        $prompt .= "- Rispondi SOLO con il JSON, nessun altro testo.\n";

        // Call Google Gemini API
        $aiContent = AIService::generateContent($prompt, [
            'maxOutputTokens'  => 8192,
            'temperature'      => 0.3,
            'responseMimeType' => 'application/json',
        ]);

        // Robust JSON extraction using Shared AIService helper
        $aiJson = AIService::extractJson($aiContent);
        
        if (!$aiJson) {
            error_log('[AI_TRANSPORT] Invalid JSON: ' . $aiContent);
            $aiJson = [
                'consigli'         => $aiContent,
                'viaggi_multipli'  => [],
                'punti_raccolta'   => [],
                'fuori_percorso'   => [],
                'risparmio_stimato' => '',
            ];
        }

        // Persist the AI response if we have a transport ID
        if (!empty($transportId)) {
            $this->repo->updateTransportAiResponse($transportId, json_encode($aiJson));
        }

        Audit::log('AI_ANALYSIS', 'transports', $transportId ?: 'PREVIEW', null, ['model' => 'gemini-2.5-flash']);
        return $aiJson;
    }
}
