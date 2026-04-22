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
                   td.website_url, td.fee_per_athlete, td.accommodation_info, td.rooming_list_path, td.summary_pdf_path
            FROM events e
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN tournament_details td ON e.id = td.event_id
            WHERE e.type = 'tournament' AND e.deleted_at IS NULL
              AND (e.tenant_id = :tid OR e.tenant_id = 'TNT_fusion')
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
                   td.website_url, td.fee_per_athlete, td.accommodation_info, td.rooming_list_path, td.summary_pdf_path
            FROM events e
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN tournament_details td ON e.id = td.event_id
            WHERE e.id = :id AND e.type = 'tournament' AND e.deleted_at IS NULL
              AND e.tenant_id = :tid
        ");
        $stmt->execute([':id' => $id, ':tid' => $tid]);
        $res = $stmt->fetch(PDO::FETCH_ASSOC);

        // Fallback for detail view
        if (!$res && $tid !== 'TNT_fusion') {
            $stmt->execute([':id' => $id, ':tid' => 'TNT_fusion']);
            $res = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        return $res ?: null;
    }

    /**
     * Get matches for a tournament
     */
    public function getMatches(string $tournamentId): array
    {
        $tid = TenantContext::id();
        $stmt = $this->db->prepare("
            SELECT tm.* FROM tournament_matches tm
            JOIN events e ON e.id = tm.event_id
            WHERE tm.event_id = :id AND (e.tenant_id = :tid OR e.tenant_id = 'TNT_fusion')
            ORDER BY tm.match_time ASC
        ");
        $stmt->execute([':id' => $tournamentId, ':tid' => $tid]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Get roster with attendance status
     */
    public function getRoster(string $tournamentId, string $teamId): array
    {
        $tid = TenantContext::id();
        $stmt = $this->db->prepare("
            SELECT a.id, a.full_name, a.first_name, a.last_name, a.jersey_number, a.role, 'athlete' as member_type,
                   ea.status as attendance_status, a.identity_document, a.birth_date
            FROM athletes a
            LEFT JOIN event_attendees ea ON a.id = ea.athlete_id AND ea.event_id = :event_id1
            WHERE a.team_id = :team_id1 AND a.tenant_id = :tid1 AND a.deleted_at IS NULL AND a.is_active = 1
            
            UNION ALL
            
            SELECT s.id, CONCAT(s.first_name, ' ', s.last_name) AS full_name, s.first_name, s.last_name, NULL as jersey_number, s.role, 'staff' as member_type,
                   ea.status as attendance_status, s.identity_document, s.birth_date
            FROM staff_members s
            JOIN staff_teams st ON s.id = st.staff_id
            JOIN team_seasons ts ON st.team_season_id = ts.id AND ts.team_id = :team_id2
            LEFT JOIN event_attendees ea ON s.id = ea.athlete_id AND ea.event_id = :event_id2
            WHERE s.is_deleted = 0 AND s.tenant_id = :tid2
            
            ORDER BY full_name ASC
        ");
        $stmt->execute([
            ':team_id1' => $teamId,
            ':event_id1' => $tournamentId,
            ':tid1' => $tid,
            ':team_id2' => $teamId,
            ':event_id2' => $tournamentId,
            ':tid2' => $tid
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
            $tid = TenantContext::id();
            $stmt = $this->db->prepare("
                UPDATE events 
                SET title = :title, event_date = :event_date, event_end = :event_end, location_name = :location_name
                WHERE id = :id AND type = 'tournament' AND tenant_id = :tid
            ");
            $stmt->execute([
                ':id' => $id,
                ':title' => $data['title'],
                ':event_date' => $data['event_date'],
                ':event_end' => $data['event_end'],
                ':location_name' => $data['location_name'],
                ':tid' => $tid
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
            WHERE a.team_id = :team_id1 AND a.tenant_id = :tid1 AND a.deleted_at IS NULL AND a.is_active = 1
            
            UNION ALL
            
            SELECT s.id
            FROM staff_members s
            JOIN staff_teams st ON s.id = st.staff_id
            JOIN team_seasons ts ON st.team_season_id = ts.id AND ts.team_id = :team_id2
            WHERE s.is_deleted = 0 AND s.tenant_id = :tid2
        ");
        $tid = TenantContext::id();
        $rosterStmt->execute([
            ':team_id1' => $teamId,
            ':tid1' => $tid,
            ':team_id2' => $teamId,
            ':tid2' => $tid
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
    /**
     * Delete tournament (soft delete)
     */
    public function deleteTournament(string $id): void
    {
        $tid = TenantContext::id();
        $stmt = $this->db->prepare("UPDATE events SET deleted_at = NOW() WHERE id = :id AND tenant_id = :tid");
        $stmt->execute([':id' => $id, ':tid' => $tid]);
    }

    /**
     * Duplicate tournament data
     */
    public function duplicateTournament(string $originalId, string $newId, string $userId): void
    {
        // 1. Duplicate event record
        $stmtEvent = $this->db->prepare("
            INSERT INTO events (id, team_id, tenant_id, type, title, event_date, event_end, location_name, location_lat, location_lng, notes, status, created_by)
            SELECT :newId, team_id, tenant_id, type, CONCAT(title, ' (Copia)'), event_date, event_end, location_name, location_lat, location_lng, notes, 'scheduled', :userId
            FROM events WHERE id = :originalId
        ");
        $stmtEvent->execute([':newId' => $newId, ':originalId' => $originalId, ':userId' => $userId]);

        // 2. Duplicate tournament details
        $stmtDetails = $this->db->prepare("
            INSERT INTO tournament_details (event_id, website_url, fee_per_athlete, accommodation_info)
            SELECT :newId, website_url, fee_per_athlete, accommodation_info
            FROM tournament_details WHERE event_id = :originalId
        ");
        $stmtDetails->execute([':newId' => $newId, ':originalId' => $originalId]);

        // 3. Duplicate matches
        // Note: we generate a crude new ID here for each match using MD5(RAND())
        $stmtMatchesSource = $this->db->prepare("SELECT * FROM tournament_matches WHERE event_id = :originalId");
        $stmtMatchesSource->execute([':originalId' => $originalId]);
        $matches = $stmtMatchesSource->fetchAll(\PDO::FETCH_ASSOC);

        $stmtInsertMatch = $this->db->prepare("
            INSERT INTO tournament_matches (id, event_id, match_time, opponent_name, court_name, our_score, opponent_score, status)
            VALUES (:id, :event_id, :match_time, :opponent_name, :court_name, :our_score, :opponent_score, :status)
        ");

        foreach ($matches as $m) {
            $newMatchId = 'TMT_' . substr(md5(uniqid('', true)), 0, 8);
            $stmtInsertMatch->execute([
                ':id' => $newMatchId,
                ':event_id' => $newId,
                ':match_time' => $m['match_time'],
                ':opponent_name' => $m['opponent_name'],
                ':court_name' => $m['court_name'],
                ':our_score' => 0,
                ':opponent_score' => 0,
                ':status' => 'scheduled'
            ]);
        }
    }

    /**
     * Get expenses for a tournament
     */
    public function getExpenses(string $tournamentId): array
    {
        $tid = TenantContext::id();
        $stmt = $this->db->prepare(
            "SELECT te.* FROM tournament_expenses te
             JOIN events e ON e.id = te.event_id
             WHERE te.event_id = :id AND (e.tenant_id = :tid OR e.tenant_id = 'TNT_fusion')
             ORDER BY te.created_at ASC"
        );
        $stmt->execute([':id' => $tournamentId, ':tid' => $tid]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Save tournament expense
     */
    public function saveExpense(array $data): void
    {
        if (empty($data['id'])) {
            $id = 'EXP_' . substr(md5(uniqid('', true)), 0, 8);
            $stmt = $this->db->prepare("
                INSERT INTO tournament_expenses (id, event_id, description, amount)
                VALUES (:id, :event_id, :description, :amount)
            ");
        } else {
            $id = $data['id'];
            $stmt = $this->db->prepare("
                UPDATE tournament_expenses
                SET description = :description, amount = :amount
                WHERE id = :id AND event_id = :event_id
            ");
        }

        $stmt->execute([
            ':id' => $id,
            ':event_id' => $data['event_id'],
            ':description' => $data['description'],
            ':amount' => $data['amount']
        ]);
    }

    /**
     * Delete expense
     */
    public function deleteExpense(string $id): void
    {
        $tid = TenantContext::id();
        $stmt = $this->db->prepare(
            "DELETE te FROM tournament_expenses te
             JOIN events e ON e.id = te.event_id
             WHERE te.id = :id AND e.tenant_id = :tid"
        );
        $stmt->execute([':id' => $id, ':tid' => $tid]);
    }

    /**
     * Update rooming list path
     */
    public function updateRoomingListPath(string $id, ?string $path): void
    {
        $stmt = $this->db->prepare("
            UPDATE tournament_details 
            SET rooming_list_path = :path
            WHERE event_id = :id
        ");
        $stmt->execute([':id' => $id, ':path' => $path]);
    }

    /**
     * Update summary pdf path
     */
    public function updateSummaryPdfPath(string $id, ?string $path): void
    {
        $stmt = $this->db->prepare("
            UPDATE tournament_details 
            SET summary_pdf_path = :path
            WHERE event_id = :id
        ");
        $stmt->execute([':id' => $id, ':path' => $path]);
    }

    /**
     * Get transports for event
     */
    public function getTransportsForEvent(string $eventId): array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM transports
            WHERE event_id = :event_id
            ORDER BY transport_date ASC, arrival_time ASC LIMIT 200
        ");
        $stmt->execute([':event_id' => $eventId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
