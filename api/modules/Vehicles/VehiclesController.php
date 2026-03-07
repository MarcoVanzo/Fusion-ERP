<?php
declare(strict_types=1);

namespace FusionERP\Modules\Vehicles;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;

class VehiclesController
{
    private ?VehiclesRepository $repo = null;

    public function __construct()
    {
    }

    private function repo(): VehiclesRepository
    {
        if ($this->repo === null) {
            $this->repo = new VehiclesRepository();
        }
        return $this->repo;
    }

    // ─── VEHICLES ─────────────────────────────────────────────────────────────

    public function getAllVehicles(): void
    {
        Auth::requireRead('transport');
        Response::success($this->repo()->getAllVehicles());
    }

    public function getVehicleById(): void
    {
        Auth::requireRead('transport');
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($id)) {
            Response::error('ID veicolo obbligatorio', 400);
            return;
        }

        $vehicle = $this->repo()->getVehicleById($id);
        if (!$vehicle) {
            Response::error('Veicolo non trovato', 404);
            return;
        }

        Response::success($vehicle);
    }

    public function createVehicle(): void
    {
        $user = Auth::requireWrite('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name', 'license_plate']);

        $id = 'VEH_' . bin2hex(random_bytes(4));
        $this->repo()->createVehicle([
            ':id' => $id,
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':license_plate' => htmlspecialchars(trim(strtoupper($body['license_plate'])), ENT_QUOTES, 'UTF-8'),
            ':capacity' => isset($body['capacity']) ? (int)$body['capacity'] : 9,
            ':status' => $body['status'] ?? 'active',
            ':insurance_expiry' => $body['insurance_expiry'] ?? null,
            ':road_tax_expiry' => $body['road_tax_expiry'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ]);

        Audit::log('INSERT', 'vehicles', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateVehicle(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'name', 'license_plate']);

        $success = $this->repo()->updateVehicle($body['id'], [
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':license_plate' => htmlspecialchars(trim(strtoupper($body['license_plate'])), ENT_QUOTES, 'UTF-8'),
            ':capacity' => isset($body['capacity']) ? (int)$body['capacity'] : 9,
            ':status' => $body['status'] ?? 'active',
            ':insurance_expiry' => $body['insurance_expiry'] ?? null,
            ':road_tax_expiry' => $body['road_tax_expiry'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ]);

        if (!$success) {
            Response::error('Veicolo non trovato', 404);
            return;
        }

        Audit::log('UPDATE', 'vehicles', $body['id'], null, $body);
        Response::success(['message' => 'Veicolo aggiornato']);
    }

    public function deleteVehicle(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';

        if (empty($id)) {
            Response::error('ID veicolo obbligatorio', 400);
            return;
        }

        $success = $this->repo()->deleteVehicle($id);
        if (!$success) {
            Response::error('Veicolo non trovato', 404);
            return;
        }

        Audit::log('DELETE', 'vehicles', $id, null, null);
        Response::success(['message' => 'Veicolo eliminato']);
    }

    // ─── MAINTENANCE ──────────────────────────────────────────────────────────

    public function addMaintenance(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['vehicle_id', 'maintenance_date', 'type']);

        $id = 'MAI_' . bin2hex(random_bytes(4));
        $this->repo()->addMaintenance([
            ':id' => $id,
            ':vehicle_id' => $body['vehicle_id'],
            ':maintenance_date' => $body['maintenance_date'],
            ':type' => $body['type'],
            ':description' => $body['description'] ?? null,
            ':cost' => isset($body['cost']) ? (float)$body['cost'] : 0.00,
            ':mileage' => isset($body['mileage']) ? (int)$body['mileage'] : null,
            ':next_maintenance_date' => $body['next_maintenance_date'] ?? null,
            ':next_maintenance_mileage' => isset($body['next_maintenance_mileage']) ? (int)$body['next_maintenance_mileage'] : null,
        ]);

        Audit::log('INSERT', 'vehicle_maintenance', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    // ─── ANOMALIES ────────────────────────────────────────────────────────────

    public function addAnomaly(): void
    {
        $user = Auth::requireRead('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['vehicle_id', 'description']);

        $id = 'ANO_' . bin2hex(random_bytes(4));
        $this->repo()->addAnomaly([
            ':id' => $id,
            ':vehicle_id' => $body['vehicle_id'],
            ':reporter_id' => $user['id'],
            ':description' => htmlspecialchars(trim($body['description']), ENT_QUOTES, 'UTF-8'),
            ':severity' => $body['severity'] ?? 'medium',
            ':status' => 'open'
        ]);

        // Could also update vehicle status to 'maintenance' or 'out_of_service' depending on severity
        // if ($body['severity'] === 'critical') { ... }

        Audit::log('INSERT', 'vehicle_anomalies', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateAnomalyStatus(): void
    {
        Auth::requireWrite('transport');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'status']);

        $success = $this->repo()->updateAnomalyStatus($body['id'], [
            ':status' => $body['status'],
            ':resolution_notes' => $body['resolution_notes'] ?? null,
            ':resolved_date' => $body['status'] === 'resolved' ? date('Y-m-d H:i:s') : null,
        ]);

        if (!$success) {
            Response::error('Anomalia non trovata', 404);
            return;
        }

        Audit::log('UPDATE', 'vehicle_anomalies', $body['id'], null, $body);
        Response::success(['message' => 'Stato anomalia aggiornato']);
    }
}