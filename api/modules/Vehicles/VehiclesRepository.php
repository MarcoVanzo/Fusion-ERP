<?php
declare(strict_types=1);

namespace FusionERP\Modules\Vehicles;

use PDO;
use Exception;

require_once __DIR__ . '/../../Shared/Database.php';

class VehiclesRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = \FusionERP\Shared\Database::getInstance();
    }

    // ─── VEHICLES ─────────────────────────────────────────────────────────────

    public function getAllVehicles(): array
    {
        $stmt = $this->db->query("
            SELECT v.*,
                   (SELECT COUNT(*) FROM vehicle_maintenance WHERE vehicle_id = v.id) as maintenance_count,
                   (SELECT COUNT(*) FROM vehicle_anomalies WHERE vehicle_id = v.id AND status != 'resolved') as open_anomalies
            FROM vehicles v
            ORDER BY v.name ASC
        ");
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getVehicleById(string $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM vehicles WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $vehicle = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$vehicle) {
            return null;
        }

        // Fetch maintenance
        $stmt = $this->db->prepare("SELECT * FROM vehicle_maintenance WHERE vehicle_id = :id ORDER BY maintenance_date DESC");
        $stmt->execute([':id' => $id]);
        $vehicle['maintenance'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch anomalies
        $stmt = $this->db->prepare("
            SELECT a.*, u.full_name as reporter_name
            FROM vehicle_anomalies a
            LEFT JOIN users u ON a.reporter_id = u.id
            WHERE a.vehicle_id = :id
            ORDER BY a.report_date DESC
        ");
        $stmt->execute([':id' => $id]);
        $vehicle['anomalies'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return $vehicle;
    }

    public function createVehicle(array $params): void
    {
        $sql = "INSERT INTO vehicles (id, name, license_plate, capacity, status, insurance_expiry, road_tax_expiry, notes)
                VALUES (:id, :name, :license_plate, :capacity, :status, :insurance_expiry, :road_tax_expiry, :notes)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
    }

    public function updateVehicle(string $id, array $params): bool
    {
        // First check if vehicle exists
        $check = $this->db->prepare("SELECT COUNT(*) FROM vehicles WHERE id = :id");
        $check->execute([':id' => $id]);
        if ((int)$check->fetchColumn() === 0) {
            return false;
        }

        $params[':id'] = $id;
        $sql = "UPDATE vehicles SET
                    name = :name,
                    license_plate = :license_plate,
                    capacity = :capacity,
                    status = :status,
                    insurance_expiry = :insurance_expiry,
                    road_tax_expiry = :road_tax_expiry,
                    notes = :notes
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return true;
    }

    public function deleteVehicle(string $id): bool
    {
        $stmt = $this->db->prepare("DELETE FROM vehicles WHERE id = :id");
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // ─── MAINTENANCE ──────────────────────────────────────────────────────────

    public function addMaintenance(array $params): void
    {
        $sql = "INSERT INTO vehicle_maintenance (id, vehicle_id, maintenance_date, type, description, cost, mileage, next_maintenance_date, next_maintenance_mileage)
                VALUES (:id, :vehicle_id, :maintenance_date, :type, :description, :cost, :mileage, :next_maintenance_date, :next_maintenance_mileage)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
    }

    // ─── ANOMALIES ────────────────────────────────────────────────────────────

    public function addAnomaly(array $params): void
    {
        $sql = "INSERT INTO vehicle_anomalies (id, vehicle_id, reporter_id, description, severity, status)
                VALUES (:id, :vehicle_id, :reporter_id, :description, :severity, :status)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
    }

    public function updateAnomalyStatus(string $id, array $params): bool
    {
        $params[':id'] = $id;
        $sql = "UPDATE vehicle_anomalies SET
                    status = :status,
                    resolution_notes = :resolution_notes,
                    resolved_date = :resolved_date
                WHERE id = :id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount() > 0;
    }
}