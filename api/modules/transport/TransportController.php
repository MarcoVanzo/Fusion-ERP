<?php
/**
 * Transport Controller — Events, Carpooling, Routes, Reimbursements, Email
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Transport;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use Mpdf\Mpdf;
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailerException;

class TransportController
{
    private TransportRepository $repo;

    public function __construct()
    {
        $this->repo = new TransportRepository();
    }

    // ─── EVENTS ───────────────────────────────────────────────────────────────

    public function listEvents(): void
    {
        Auth::requireAuth();
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $type = filter_input(INPUT_GET, 'type', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        Response::success($this->repo->listEvents($teamId, $type));
    }

    public function createEvent(): void
    {
        $user = Auth::requireRole('operator');
        $body = Response::jsonBody();
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
        Response::success(['id' => $id], 201);
    }

    public function cancelEvent(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        $before = $this->repo->getEventById($id);
        $this->repo->updateEventStatus($id, 'cancelled');
        Audit::log('UPDATE', 'events', $id, $before, ['status' => 'cancelled']);
        Response::success(['message' => 'Evento annullato']);
    }

    // ─── CARPOOL ROUTES ───────────────────────────────────────────────────────

    public function listRoutes(): void
    {
        Auth::requireAuth();
        $eventId = filter_input(INPUT_GET, 'eventId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($eventId)) {
            Response::error('eventId obbligatorio', 400);
        }
        Response::success($this->repo->listRoutesByEvent($eventId));
    }

    public function createRoute(): void
    {
        $user = Auth::requireAuth();
        $body = Response::jsonBody();
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
        Response::success(['id' => $id], 201);
    }

    public function updateRouteDistance(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        Response::requireFields($body, ['routeId', 'distanceKm']);

        $km = (float)$body['distanceKm'];
        $mileageRate = (float)(getenv('MILEAGE_RATE') ?: 0.25);
        $reimbursement = round($km * $mileageRate, 2);

        $this->repo->updateRouteDistance($body['routeId'], $km, $reimbursement);
        Audit::log('UPDATE', 'carpool_routes', $body['routeId'], null, ['distance_km' => $km]);
        Response::success(['distance_km' => $km, 'reimbursement_eur' => $reimbursement]);
    }

    // ─── PASSENGERS ───────────────────────────────────────────────────────────

    public function addPassenger(): void
    {
        $user = Auth::requireAuth();
        $body = Response::jsonBody();
        Response::requireFields($body, ['route_id', 'athlete_id']);

        $route = $this->repo->getRouteById($body['route_id']);
        if (!$route) {
            Response::error('Tratta non trovata', 404);
        }
        if ($route['seats_available'] <= 0) {
            Response::error('Nessun posto disponibile', 409);
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
        Response::success(['message' => 'Richiesta passaggio inviata'], 201);
    }

    public function confirmPassenger(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        $passId = (int)($body['passengerId'] ?? 0);
        if (!$passId) {
            Response::error('passengerId obbligatorio', 400);
        }

        $this->repo->confirmPassenger($passId);
        $this->repo->decrementSeats($body['routeId'] ?? '');
        Audit::log('UPDATE', 'carpool_passengers', (string)$passId, null, ['status' => 'confirmed']);
        Response::success(['message' => 'Passeggero confermato']);
    }

    public function matchCarpool(): void
    {
        Auth::requireRole('manager');
        $eventId = filter_input(INPUT_GET, 'eventId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($eventId)) {
            Response::error('eventId obbligatorio', 400);
        }
        Response::success($this->repo->matchCarpoolForEvent($eventId));
    }

    // ─── REIMBURSEMENTS ───────────────────────────────────────────────────────

    public function generateReimbursement(): void
    {
        $user = Auth::requireRole('operator');
        $body = Response::jsonBody();
        Response::requireFields($body, ['carpoolId', 'distanceKm']);

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
        Response::success(['id' => $reimbId, 'total_eur' => $total, 'pdf_path' => $pdfPath]);
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
    <td>{$km}</td>
    <td>€ {$rate}</td>
    <td class="total">€ {$total}</td>
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

    public function sendConvocations(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $eventId = $body['eventId'] ?? '';
        if (empty($eventId)) {
            Response::error('eventId obbligatorio', 400);
        }

        $event = $this->repo->getEventById($eventId);
        if (!$event) {
            Response::error('Evento non trovato', 404);
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
        Response::success(['sent' => $sent, 'failed' => $failed]);
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
}