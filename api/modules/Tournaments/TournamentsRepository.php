<?php
/**
 * Tournaments Repository
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tournaments;

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use PDO;

class TournamentsRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get all tournaments
     */
    public function listTournaments(): array
    {
        $tid = TenantContext::id();
        $stmt = $this->db->prepare("
            SELECT e.*, t.name as team_name,
                   td.website_url, td.fee_per_athlete, td.accommodation_info
            FROM events e
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN tournament_details td ON e.id = td.event_id
            WHERE e.type = 'tournament' AND e.deleted_at IS NULL
              AND e.tenant_id = :tid
            ORDER BY e.event_date DESC
        ");
        $stmt->execute([':tid' => $tid]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get tournament by ID
     */
    public function getTournament(string $id): ?array
    {
        $tid = TenantContext::id();
        $stmt = $this->db->prepare("
            SELECT e.*, t.name as team_name,
                   td.website_url, td.fee_per_athlete, td.accommodation_info
            FROM events e
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN tournament_details td ON e.id = td.event_id
            WHERE e.id = :id AND e.type = 'tournament' AND e.deleted_at IS NULL
              AND e.tenant_id = :tid
        ");
        $stmt->execute([':id' => $id, ':tid' => $tid]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    /**
     * Get matches for a tournament
     */
    public function getMatches(string $tournamentId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM tournament_matches
            WHERE event_id = :id
            ORDER BY match_time ASC
        ");
        $stmt->execute([':id' => $tournamentId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get roster with attendance status
     */
    public function getRoster(string $tournamentId, string $teamId): array
    {
        $stmt = $this->db->prepare("
            SELECT a.id, a.full_name, a.jersey_number, a.role,
                   ea.status as attendance_status
            FROM athletes a
            LEFT JOIN event_attendees ea ON a.id = ea.athlete_id AND ea.event_id = :event_id1
            WHERE a.team_id = :team_id1 AND a.deleted_at IS NULL AND a.is_active = 1
            
            UNION ALL
            
            SELECT s.id, CONCAT(s.first_name, ' ', s.last_name) AS full_name, NULL as jersey_number, s.role,
                   ea.status as attendance_status
            FROM staff_members s
            JOIN staff_teams st ON s.id = st.staff_id
            JOIN team_seasons ts ON st.team_season_id = ts.id AND ts.team_id = :team_id2
            LEFT JOIN event_attendees ea ON s.id = ea.athlete_id AND ea.event_id = :event_id2
            WHERE s.is_deleted = 0
            
            ORDER BY full_name ASC
        ");
        $stmt->execute([
            ':team_id1' => $teamId,
            ':event_id1' => $tournamentId,
            ':team_id2' => $teamId,
            ':event_id2' => $tournamentId
        ]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Upsert event and details
     */
    public function upsertTournament(array $data): void
    {
        $id = $data['id'];
        $isUpdate = $data['is_update'] ?? false;

        if (!$isUpdate) {
            $tid = TenantContext::id();
            $stmt = $this->db->prepare("
                INSERT INTO events (id, tenant_id, team_id, type, title, event_date, event_end, location_name, created_by)
                VALUES (:id, :tenant_id, :team_id, 'tournament', :title, :event_date, :event_end, :location_name, :created_by)
            ");
            $stmt->execute([
                ':id' => $id,
                ':tenant_id' => $tid,
                ':team_id' => $data['team_id'],
                ':title' => $data['title'],
                ':event_date' => $data['event_date'],
                ':event_end' => $data['event_end'],
                ':location_name' => $data['location_name'],
                ':created_by' => $data['created_by']
            ]);
        } else {
            $stmt = $this->db->prepare("
                UPDATE events 
                SET title = :title, event_date = :event_date, event_end = :event_end, location_name = :location_name
                WHERE id = :id AND type = 'tournament'
            ");
            $stmt->execute([
                ':id' => $id,
                ':title' => $data['title'],
                ':event_date' => $data['event_date'],
                ':event_end' => $data['event_end'],
                ':location_name' => $data['location_name']
            ]);
        }

        // Handle Details
        $stmtDetails = $this->db->prepare("
            INSERT INTO tournament_details (event_id, website_url, fee_per_athlete, accommodation_info)
            VALUES (:id, :website_url, :fee, :acc_info)
            ON DUPLICATE KEY UPDATE 
                website_url = VALUES(website_url),
                fee_per_athlete = VALUES(fee_per_athlete),
                accommodation_info = VALUES(accommodation_info)
        ");
        $stmtDetails->execute([
            ':id' => $id,
            ':website_url' => $data['website_url'],
            ':fee' => $data['fee_per_athlete'],
            ':acc_info' => $data['accommodation_info']
        ]);
    }

    /**
     * Auto-convocate athletes
     */
    public function autoConvocate(string $tournamentId, string $teamId): void
    {
        $rosterStmt = $this->db->prepare("
            SELECT a.id
            FROM athletes a
            WHERE a.team_id = :team_id1 AND a.deleted_at IS NULL AND a.is_active = 1
            
            UNION ALL
            
            SELECT s.id
            FROM staff_members s
            JOIN staff_teams st ON s.id = st.staff_id
            JOIN team_seasons ts ON st.team_season_id = ts.id AND ts.team_id = :team_id2
            WHERE s.is_deleted = 0
        ");
        $rosterStmt->execute([
            ':team_id1' => $teamId,
            ':team_id2' => $teamId
        ]);
        $athletes = $rosterStmt->fetchAll(PDO::FETCH_COLUMN);

        $attStmt = $this->db->prepare("
            INSERT INTO event_attendees (id, event_id, athlete_id, status)
            VALUES (:id, :event_id, :athlete_id, 'confirmed')
            ON DUPLICATE KEY UPDATE status = 'confirmed'
        ");
        foreach ($athletes as $athleteId) {
            $attId = 'ATT_' . substr(md5($tournamentId . $athleteId), 0, 8);
            $attStmt->execute([
                ':id' => $attId,
                ':event_id' => $tournamentId,
                ':athlete_id' => $athleteId
            ]);
        }
    }

    /**
     * Update roster status
     */
    public function updateRosterStatus(string $tournamentId, array $attendees): void
    {
        $stmt = $this->db->prepare("
            INSERT INTO event_attendees (id, event_id, athlete_id, status)
            VALUES (:id, :event_id, :athlete_id, :status)
            ON DUPLICATE KEY UPDATE status = VALUES(status)
        ");

        foreach ($attendees as $att) {
            $id = 'ATT_' . substr(md5($tournamentId . $att['athlete_id']), 0, 8);
            $stmt->execute([
                ':id' => $id,
                ':event_id' => $tournamentId,
                ':athlete_id' => $att['athlete_id'],
                ':status' => $att['status']
            ]);
        }
    }

    /**
     * Save Match
     */
    public function saveMatch(array $data): void
    {
        if (empty($data['id'])) {
            $id = 'TMT_' . substr(md5((string)time() . $data['opponent_name']), 0, 8);
            $stmt = $this->db->prepare("
                INSERT INTO tournament_matches (id, event_id, match_time, opponent_name, court_name, our_score, opponent_score, status)
                VALUES (:id, :event_id, :match_time, :opponent_name, :court_name, :our_score, :opponent_score, :status)
            ");
        }
        else {
            $id = $data['id'];
            $stmt = $this->db->prepare("
                UPDATE tournament_matches
                SET match_time = :match_time, opponent_name = :opponent_name, court_name = :court_name,
                    our_score = :our_score, opponent_score = :opponent_score, status = :status
                WHERE id = :id AND event_id = :event_id
            ");
        }

        $stmt->execute([
            ':id' => $id,
            ':event_id' => $data['event_id'],
            ':match_time' => $data['match_time'],
            ':opponent_name' => $data['opponent_name'],
            ':court_name' => $data['court_name'],
            ':our_score' => $data['our_score'],
            ':opponent_score' => $data['opponent_score'],
            ':status' => $data['status']
        ]);
    }
}
