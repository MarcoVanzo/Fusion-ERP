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
        Auth::requireRead('transport');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $type = filter_input(INPUT_GET, 'type', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        Response::success($this->repo->listEvents($teamId, $type));
    }

    public function createEvent(): void
    {
        $user = Auth::requireWrite('transport');
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
        Auth::requireWrite('transport');
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
        Auth::requireRead('transport');
        $eventId = filter_input(INPUT_GET, 'eventId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($eventId)) {
            Response::error('eventId obbligatorio', 400);
        }
        Response::success($this->repo->listRoutesByEvent($eventId));
    }

    public function createRoute(): void
    {
        $user = Auth::requireWrite('transport');
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
        Auth::requireWrite('transport');
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
        $user = Auth::requireRead('transport');
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
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $passId = (int)($body['passengerId'] ?? 0);
        if (!$passId) {
            Response::error('passengerId obbligatorio', 400);
        }
        $routeId = (string)($body['routeId'] ?? '');
        if (empty($routeId)) {
            Response::error('routeId obbligatorio', 400);
        }

        $db = \FusionERP\Shared\Database::getInstance();
        $db->beginTransaction();
        try {
            $this->repo->confirmPassenger($passId);

            // Atomic decrement: fails gracefully if no seats are available,
            // preventing overbooking under concurrent requests.
            $affected = $this->repo->decrementSeatsAtomic($routeId);
            if ($affected === 0) {
                $db->rollBack();
                Response::error('Nessun posto disponibile — la conferma è stata annullata.', 409);
            }

            $db->commit();
        }
        catch (\Throwable $e) {
            $db->rollBack();
            throw $e;
        }

        Audit::log('UPDATE', 'carpool_passengers', (string)$passId, null, ['status' => 'confirmed']);
        Response::success(['message' => 'Passeggero confermato']);
    }

    public function matchCarpool(): void
    {
        Auth::requireWrite('transport');
        $eventId = filter_input(INPUT_GET, 'eventId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($eventId)) {
            Response::error('eventId obbligatorio', 400);
        }
        Response::success($this->repo->matchCarpoolForEvent($eventId));
    }

    // ─── REIMBURSEMENTS ───────────────────────────────────────────────────────

    public function generateReimbursement(): void
    {
        $user = Auth::requireWrite('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['carpoolId', 'distanceKm']);

        // ── Idempotency check ────────────────────────────────────────────────────────────────────────
        // Prevents double reimbursements on double-click or network retry.
        $existing = $this->repo->getReimbursementByCarpool($body['carpoolId']);
        if ($existing) {
            Response::success([
                'id' => $existing['id'],
                'total_eur' => (float)$existing['total_eur'],
                'pdf_path' => $existing['pdf_path'] ?? null,
                'message' => 'Rimborso già esistente per questa tratta.',
            ]);
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

    public function sendConvocations(): void
    {
        Auth::requireWrite('transport');
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

    // ─── GYMS ─────────────────────────────────────────────────────────────────

    public function listGyms(): void
    {
        Auth::requireRead('transport');
        Response::success($this->repo->listGyms());
    }

    public function createGym(): void
    {
        $user = Auth::requireWrite('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name']);

        $id = 'GYM_' . bin2hex(random_bytes(4));
        $this->repo->createGym([
            ':id' => $id,
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':address' => $body['address'] ?? null,
            ':lat' => isset($body['lat']) ? (float)$body['lat'] : null,
            ':lng' => isset($body['lng']) ? (float)$body['lng'] : null,
            ':created_by' => $user['id'],
        ]);

        Audit::log('INSERT', 'gyms', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function deleteGym(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        $deleted = $this->repo->deleteGym($id);
        if (!$deleted) {
            Response::error('Palestra non trovata', 404);
        }

        Audit::log('DELETE', 'gyms', $id, null, null);
        Response::success(['message' => 'Palestra eliminata']);
    }

    // ─── TEAM ATHLETES ────────────────────────────────────────────────────────

    public function listTeamAthletes(): void
    {
        Auth::requireRead('transport');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($teamId)) {
            Response::error('teamId obbligatorio', 400);
        }
        Response::success($this->repo->listTeamAthletes($teamId));
    }

    // ─── TRANSPORTS ───────────────────────────────────────────────────────────

    public function saveTransport(): void
    {
        $user = Auth::requireWrite('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['team_id', 'destination_name', 'arrival_time', 'athletes_json']);

        $id = 'TRP_' . bin2hex(random_bytes(4));
        $this->repo->saveTransport([
            ':id' => $id,
            ':team_id' => $body['team_id'],
            ':destination_name' => htmlspecialchars(trim($body['destination_name']), ENT_QUOTES, 'UTF-8'),
            ':destination_address' => $body['destination_address'] ?? null,
            ':destination_lat' => isset($body['destination_lat']) ? (float)$body['destination_lat'] : null,
            ':destination_lng' => isset($body['destination_lng']) ? (float)$body['destination_lng'] : null,
            ':departure_address' => $body['departure_address'] ?? null,
            ':arrival_time' => $body['arrival_time'],
            ':departure_time' => $body['departure_time'] ?? null,
            ':transport_date' => $body['transport_date'] ?? date('Y-m-d'),
            ':athletes_json' => json_encode($body['athletes_json']),
            ':timeline_json' => isset($body['timeline_json']) ? json_encode($body['timeline_json']) : null,
            ':stats_json' => isset($body['stats_json']) ? json_encode($body['stats_json']) : null,
            ':ai_response' => isset($body['ai_response']) ? json_encode($body['ai_response']) : null,
            ':created_by' => $user['id'],
        ]);

        Audit::log('INSERT', 'transports', $id, null, ['destination' => $body['destination_name']]);
        Response::success(['id' => $id], 201);
    }

    public function listTransports(): void
    {
        Auth::requireRead('transport');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        Response::success($this->repo->listTransports($teamId));
    }

    // ─── TEAMS (for dropdowns) ────────────────────────────────────────────────

    public function listTeams(): void
    {
        Auth::requireRead('transport');
        Response::success($this->repo->listTeams());
    }

    // ─── DRIVERS ─────────────────────────────────────────────────────────────

    public function listDrivers(): void
    {
        Auth::requireRead('transport');
        Response::success($this->repo->listDrivers());
    }

    public function createDriver(): void
    {
        $user = Auth::requireWrite('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['full_name']);

        $id = 'DRV_' . bin2hex(random_bytes(4));
        $this->repo->createDriver([
            ':id' => $id,
            ':full_name' => htmlspecialchars(trim($body['full_name']), ENT_QUOTES, 'UTF-8'),
            ':phone' => $body['phone'] ?? null,
            ':license_number' => $body['license_number'] ?? null,
            ':hourly_rate' => isset($body['hourly_rate']) ? (float)$body['hourly_rate'] : null,
            ':notes' => $body['notes'] ?? null,
            ':created_by' => $user['id'],
        ]);

        Audit::log('INSERT', 'drivers', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function deleteDriver(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        $this->repo->softDeleteDriver($id);
        Audit::log('DELETE', 'drivers', $id, null, null);
        Response::success(['message' => 'Autista eliminato']);
    }

    public function toggleDriverActive(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        $active = (bool)($body['is_active'] ?? true);
        $this->repo->setDriverActive($id, $active);
        Audit::log('UPDATE', 'drivers', $id, null, ['is_active' => $active]);
        Response::success(['message' => 'Stato aggiornato']);
    }
}