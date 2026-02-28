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
     * Matching query: find best carpool routes for athletes in the same team for an event.
     * Returns athletes without a confirmed route and available routes with free seats.
     */
    public function matchCarpoolForEvent(string $eventId): array
    {
        $stmt = $this->db->prepare(
            'SELECT cr.id AS route_id, cr.seats_available, cr.meeting_point_name,
                    cr.departure_time, u.full_name AS driver_name,
                    a.id AS athlete_id, a.full_name AS athlete_name, a.parent_phone,
                    cp.status AS passenger_status
             FROM carpool_routes cr
             JOIN users u ON u.id = cr.driver_user_id
             JOIN events e ON e.id = cr.event_id
             JOIN athletes a ON a.team_id = e.team_id
             LEFT JOIN carpool_passengers cp ON cp.route_id = cr.id AND cp.athlete_id = a.id
             WHERE cr.event_id = :event_id
               AND cr.deleted_at IS NULL
               AND cr.seats_available > 0
               AND (cp.status IS NULL OR cp.status = \'requested\')
             ORDER BY cr.departure_time, cr.seats_available DESC'
        );
        $stmt->execute([':event_id' => $eventId]);
        return $stmt->fetchAll();
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
}