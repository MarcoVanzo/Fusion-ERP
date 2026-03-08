<?php
/**
 * Transport Repository — DB Queries for Carpooling & Routes
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Transport;

use FusionERP\Shared\Database;

class TransportRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── EVENTS ───────────────────────────────────────────────────────────────

    public function listEvents(string $teamId = '', string $type = ''): array
    {
        $sql = 'SELECT e.id, e.team_id, e.type, e.title, e.event_date, e.event_end,
                       e.location_name, e.location_lat, e.location_lng, e.status, e.notes,
                       t.name AS team_name, t.category
                FROM events e
                JOIN teams t ON t.id = e.team_id
                WHERE e.deleted_at IS NULL';
        $params = [];
        if ($teamId !== '') {
            $sql .= ' AND e.team_id = :team_id';
            $params[':team_id'] = $teamId;
        }
        if ($type !== '') {
            $sql .= ' AND e.type = :type';
            $params[':type'] = $type;
        }
        $sql .= ' ORDER BY e.event_date DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getEventById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT e.*, t.name AS team_name, t.category
             FROM events e JOIN teams t ON t.id = e.team_id
             WHERE e.id = :id AND e.deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function createEvent(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO events (id, team_id, type, title, event_date, event_end,
                                  location_name, location_lat, location_lng, status, notes, created_by)
             VALUES (:id, :team_id, :type, :title, :event_date, :event_end,
                     :location_name, :location_lat, :location_lng, :status, :notes, :created_by)'
        );
        $stmt->execute($data);
    }

    public function updateEventStatus(string $id, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE events SET status = :status WHERE id = :id');
        $stmt->execute([':status' => $status, ':id' => $id]);
    }

    public function softDeleteEvent(string $id): void
    {
        $stmt = $this->db->prepare('UPDATE events SET deleted_at = NOW() WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    // ─── CARPOOL ROUTES ───────────────────────────────────────────────────────

    public function listRoutesByEvent(string $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT cr.id, cr.event_id, cr.driver_user_id, cr.meeting_point_name,
                    cr.meeting_point_lat, cr.meeting_point_lng, cr.departure_time,
                    cr.seats_total, cr.seats_available, cr.distance_km, cr.reimbursement_eur,
                    cr.status, cr.notes,
                    u.full_name AS driver_name, u.phone AS driver_phone
             FROM carpool_routes cr
             JOIN users u ON u.id = cr.driver_user_id
             WHERE cr.event_id = :event_id AND cr.deleted_at IS NULL
             ORDER BY cr.departure_time'
        );
        $stmt->execute([':event_id' => $eventId]);
        return $stmt->fetchAll();
    }

    public function getRouteById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT cr.*, u.full_name AS driver_name, u.phone AS driver_phone
             FROM carpool_routes cr JOIN users u ON u.id = cr.driver_user_id
             WHERE cr.id = :id AND cr.deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    public function createRoute(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO carpool_routes (id, event_id, driver_user_id, meeting_point_name,
                                         meeting_point_lat, meeting_point_lng, departure_time,
                                         seats_total, seats_available, notes)
             VALUES (:id, :event_id, :driver_user_id, :meeting_point_name,
                     :meeting_point_lat, :meeting_point_lng, :departure_time,
                     :seats_total, :seats_available, :notes)'
        );
        $stmt->execute($data);
    }

    public function updateRouteDistance(string $id, float $km, float $reimbursementEur): void
    {
        $stmt = $this->db->prepare(
            'UPDATE carpool_routes SET distance_km = :km, reimbursement_eur = :reimb WHERE id = :id'
        );
        $stmt->execute([':km' => $km, ':reimb' => $reimbursementEur, ':id' => $id]);
    }

    // ─── PASSENGERS ───────────────────────────────────────────────────────────

    public function getPassengersByRoute(string $routeId): array
    {
        $stmt = $this->db->prepare(
            'SELECT cp.id, cp.route_id, cp.athlete_id, cp.pickup_address, cp.status,
                    a.full_name AS athlete_name, a.jersey_number, a.parent_contact, a.parent_phone
             FROM carpool_passengers cp
             JOIN athletes a ON a.id = cp.athlete_id
             WHERE cp.route_id = :route_id
             ORDER BY cp.status DESC, a.full_name'
        );
        $stmt->execute([':route_id' => $routeId]);
        return $stmt->fetchAll();
    }

    public function addPassenger(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO carpool_passengers (route_id, athlete_id, requested_by, pickup_lat, pickup_lng, pickup_address)
             VALUES (:route_id, :athlete_id, :requested_by, :pickup_lat, :pickup_lng, :pickup_address)'
        );
        $stmt->execute($data);
    }

    public function confirmPassenger(int $passengerId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE carpool_passengers SET status = \'confirmed\', confirmed_at = NOW() WHERE id = :id'
        );
        $stmt->execute([':id' => $passengerId]);
    }

    public function decrementSeats(string $routeId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE carpool_routes SET seats_available = GREATEST(seats_available - 1, 0),
             status = IF(seats_available <= 1, \'full\', status)
             WHERE id = :id'
        );
        $stmt->execute([':id' => $routeId]);
    }

    /**
     * Atomically decrements seats_available only if > 0.
     * Returns the number of rows updated (1 = success, 0 = no seats left).
     * This prevents overbooking under concurrent requests without needing
     * a SELECT + UPDATE pattern that is vulnerable to race conditions.
     */
    public function decrementSeatsAtomic(string $routeId): int
    {
        $stmt = $this->db->prepare(
            'UPDATE carpool_routes
             SET seats_available = seats_available - 1,
                 status = IF(seats_available - 1 <= 0, \'full\', status)
             WHERE id = :id AND seats_available > 0'
        );
        $stmt->execute([':id' => $routeId]);
        return $stmt->rowCount();
    }



    // ─── MILEAGE ──────────────────────────────────────────────────────────────

    public function createReimbursement(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO mileage_reimbursements (id, carpool_id, user_id, distance_km, rate_eur_km, total_eur)
             VALUES (:id, :carpool_id, :user_id, :distance_km, :rate_eur_km, :total_eur)'
        );
        $stmt->execute($data);
    }

    public function updateReimbursementPdf(string $id, string $pdfPath): void
    {
        $stmt = $this->db->prepare('UPDATE mileage_reimbursements SET pdf_path = :path WHERE id = :id');
        $stmt->execute([':path' => $pdfPath, ':id' => $id]);
    }

    /**
     * Look up an existing reimbursement by carpool_id for idempotency check.
     * Returns the existing record or null if none exists.
     */
    public function getReimbursementByCarpool(string $carpoolId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, carpool_id, total_eur, pdf_path FROM mileage_reimbursements
             WHERE carpool_id = :carpool_id LIMIT 1'
        );
        $stmt->execute([':carpool_id' => $carpoolId]);
        return $stmt->fetch() ?: null;
    }

    // ─── EMAIL LOG ────────────────────────────────────────────────────────────

    public function logEmail(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO email_logs (event_id, recipient, subject, type, status, sent_at, error_msg)
             VALUES (:event_id, :recipient, :subject, :type, :status, :sent_at, :error_msg)'
        );
        $stmt->execute($data);
    }

    public function getAttendeesWithContacts(string $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT a.full_name, a.parent_contact, a.parent_phone,
                    u.email AS user_email, u.full_name AS user_name
             FROM event_attendees ea
             JOIN athletes a ON a.id = ea.athlete_id
             LEFT JOIN users u ON u.id = a.user_id
             WHERE ea.event_id = :event_id AND ea.status IN (\'invited\',\'confirmed\')'
        );
        $stmt->execute([':event_id' => $eventId]);
        return $stmt->fetchAll();
    }

    // ─── GYMS ────────────────────────────────────────────────────────────────

    public function listGyms(): array
    {
        $stmt = $this->db->query(
            'SELECT id, name, address, lat, lng FROM gyms ORDER BY name'
        );
        return $stmt->fetchAll();
    }

    public function createGym(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO gyms (id, name, address, lat, lng, created_by)
             VALUES (:id, :name, :address, :lat, :lng, :created_by)'
        );
        $stmt->execute($data);
    }

    public function deleteGym(string $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM gyms WHERE id = :id');
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // ─── TEAM ATHLETES (for transport selection) ─────────────────────────────

    public function listTeamAthletes(string $teamId): array
    {
        $stmt = $this->db->prepare(
            'SELECT a.id, a.full_name, a.jersey_number, a.role,
                    TRIM(CONCAT_WS(\', \',
                        NULLIF(TRIM(a.residence_address), \'\'),
                        NULLIF(TRIM(a.residence_city), \'\')
                    )) AS residence_address,
                    a.photo_path,
                    a.parent_contact, a.parent_phone
             FROM athletes a
             WHERE a.team_id = :team_id AND a.is_active = 1 AND a.deleted_at IS NULL
             ORDER BY a.full_name'
        );
        $stmt->execute([':team_id' => $teamId]);
        return $stmt->fetchAll();
    }

    // ─── TRANSPORTS ──────────────────────────────────────────────────────────

    public function saveTransport(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO transports (id, team_id, destination_name, destination_address,
                                      destination_lat, destination_lng, departure_address,
                                      arrival_time, departure_time, transport_date,
                                      athletes_json, timeline_json, stats_json, ai_response, created_by)
             VALUES (:id, :team_id, :destination_name, :destination_address,
                     :destination_lat, :destination_lng, :departure_address,
                     :arrival_time, :departure_time, :transport_date,
                     :athletes_json, :timeline_json, :stats_json, :ai_response, :created_by)'
        );
        $stmt->execute($data);
    }

    public function listTransports(string $teamId = ''): array
    {
        $sql = 'SELECT id, team_id, destination_name, destination_address,
                       arrival_time, departure_time, transport_date,
                       athletes_json, stats_json, created_at
                FROM transports';
        $params = [];
        if ($teamId !== '') {
            $sql .= ' WHERE team_id = :team_id';
            $params[':team_id'] = $teamId;
        }
        $sql .= ' ORDER BY transport_date DESC, created_at DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getTransportById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM transports WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    // ─── DRIVERS ─────────────────────────────────────────────────────────────

    public function listDrivers(): array
    {
        $stmt = $this->db->query(
            'SELECT id, full_name, phone, license_number, hourly_rate, is_active, notes, created_at
             FROM drivers
             WHERE deleted_at IS NULL
             ORDER BY full_name'
        );
        return $stmt->fetchAll();
    }

    public function createDriver(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO drivers (id, full_name, phone, license_number, hourly_rate, notes, is_active, created_by)
             VALUES (:id, :full_name, :phone, :license_number, :hourly_rate, :notes, 1, :created_by)'
        );
        $stmt->execute($data);
    }

    public function setDriverActive(string $id, bool $active): void
    {
        $stmt = $this->db->prepare('UPDATE drivers SET is_active = :active WHERE id = :id');
        $stmt->execute([':active' => $active ? 1 : 0, ':id' => $id]);
    }

    public function softDeleteDriver(string $id): void
    {
        $stmt = $this->db->prepare('UPDATE drivers SET deleted_at = NOW() WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    // ─── TEAMS LIST (for dropdowns) ──────────────────────────────────────────

    public function listTeams(): array
    {
        $stmt = $this->db->query(
            'SELECT id, name, category, season FROM teams
             WHERE is_active = 1 AND deleted_at IS NULL ORDER BY name'
        );
        return $stmt->fetchAll();
    }
}