<?php
/**
 * Transport Controller — Events, Carpooling, Routes, Reimbursements, Email
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Transport;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;

class TransportController
{
    private TransportRepository $repo;
    private TransportService $service;

    public function __construct()
    {
        $this->repo = new TransportRepository();
        $this->service = new TransportService();
    }

    /**
     * Helper to handle service calls with standard error handling.
     */
    private function handleServiceCall(callable $callback): void
    {
        try {
            $result = $callback();
            Response::success($result);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $httpCode);
        }
    }

    // ─── EVENTS ───────────────────────────────────────────────────────────────

    public function listEvents(): void
    {
        Auth::requireRead('transport');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_DEFAULT) ?? '';
        $type = filter_input(INPUT_GET, 'type', FILTER_DEFAULT) ?? '';
        Response::success($this->repo->listEvents($teamId, $type));
    }

    public function getStats(): void
    {
        Auth::requireRead('transport');
        Response::success($this->repo->getStats());
    }

    public function createEvent(): void
    {
        $user = Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $this->handleServiceCall(fn() => $this->service->createEvent($user, $body));
    }

    public function cancelEvent(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $this->handleServiceCall(fn() => $this->service->cancelEvent($id));
    }

    // ─── CARPOOL ROUTES ───────────────────────────────────────────────────────

    public function listRoutes(): void
    {
        Auth::requireRead('transport');
        $eventId = filter_input(INPUT_GET, 'eventId', FILTER_DEFAULT) ?? '';
        if (empty($eventId)) {
            Response::error('eventId obbligatorio', 400);
        }
        Response::success($this->repo->listRoutesByEvent($eventId));
    }

    public function createRoute(): void
    {
        $user = Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $this->handleServiceCall(fn() => $this->service->createRoute($user, $body));
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
        \FusionERP\Shared\Audit::log('UPDATE', 'carpool_routes', $body['routeId'], null, ['distance_km' => $km]);
        Response::success(['distance_km' => $km, 'reimbursement_eur' => $reimbursement]);
    }

    // ─── PASSENGERS ───────────────────────────────────────────────────────────

    public function addPassenger(): void
    {
        $user = Auth::requireRead('transport');
        $body = Response::jsonBody();
        $this->handleServiceCall(fn() => $this->service->addPassenger($user, $body));
    }

    public function confirmPassenger(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $passId = (int)($body['passengerId'] ?? 0);
        $routeId = (string)($body['routeId'] ?? '');
        if (!$passId || empty($routeId)) {
            Response::error('passengerId e routeId obbligatori', 400);
        }
        $this->handleServiceCall(fn() => $this->service->confirmPassenger($passId, $routeId));
    }

    // ─── REIMBURSEMENTS ───────────────────────────────────────────────────────

    public function generateReimbursement(): void
    {
        $user = Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $this->handleServiceCall(fn() => $this->service->generateReimbursement($user, $body));
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
        $this->handleServiceCall(fn() => $this->service->sendConvocations($eventId));
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

        \FusionERP\Shared\Audit::log('INSERT', 'gyms', $id, null, $body);
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

        \FusionERP\Shared\Audit::log('DELETE', 'gyms', $id, null, null);
        Response::success(['message' => 'Palestra eliminata']);
    }

    // ─── TEAM ATHLETES ────────────────────────────────────────────────────────

    public function listTeamAthletes(): void
    {
        Auth::requireRead('transport');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_DEFAULT) ?? '';
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

        \FusionERP\Shared\Audit::log('INSERT', 'transports', $id, null, ['destination' => $body['destination_name']]);
        Response::success(['id' => $id], 201);
    }

    public function listTransports(): void
    {
        Auth::requireRead('transport');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_DEFAULT) ?? '';
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

        \FusionERP\Shared\Audit::log('INSERT', 'drivers', $id, null, $body);
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
        \FusionERP\Shared\Audit::log('DELETE', 'drivers', $id, null, null);
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
        \FusionERP\Shared\Audit::log('UPDATE', 'drivers', $id, null, ['is_active' => $active]);
        Response::success(['message' => 'Stato aggiornato']);
    }

    // ─── AI ANALYSIS ─────────────────────────────────────────────────────────

    public function analyzeTransportAI(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $this->handleServiceCall(fn() => $this->service->analyzeTransportAI($body));
    }
}