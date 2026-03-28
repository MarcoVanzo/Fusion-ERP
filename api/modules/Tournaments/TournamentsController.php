<?php
/**
 * Tournaments Controller
 * Fusion ERP v1.0
 * 
 * Manages external tournaments, roster (via event_attendees), and matches.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tournaments;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Database;
use FusionERP\Shared\Response;
use PDO;

class TournamentsController
{
    /**
     * Get all tournaments (events of type 'tournament')
     * GET /api?module=tournaments&action=getTournaments
     */
    public function getTournaments(): void
    {
        Auth::requireRead('tournaments');

        $pdo = Database::getInstance();
        $stmt = $pdo->prepare("
            SELECT e.*, t.name as team_name,
                   td.website_url, td.fee_per_athlete, td.accommodation_info
            FROM events e
            LEFT JOIN teams t ON e.team_id = t.id
            LEFT JOIN tournament_details td ON e.id = td.event_id
            WHERE e.type = 'tournament' AND e.deleted_at IS NULL
            ORDER BY e.event_date DESC
        ");
        $stmt->execute();
        $tournaments = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success(['tournaments' => $tournaments]);
    }

    /**
     * Get a single tournament with its matches and roster
     * GET /api?module=tournaments&action=getTournament&id=EVT_...
     */
    public function getTournament(): void
    {
        Auth::requireRead('tournaments');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT);

        if (!$id) {
            Response::error('Invalid tournament ID.', 400);
        }

        $pdo = Database::getInstance();

        // 1. Get Event & Details
        $stmt = $pdo->prepare("
            SELECT e.*, t.name as team_name,
                   td.website_url, td.fee_per_athlete, td.accommodation_info
            FROM events e
            JOIN teams t ON e.team_id = t.id
            LEFT JOIN tournament_details td ON e.id = td.event_id
            WHERE e.id = :id AND e.type = 'tournament' AND e.deleted_at IS NULL
        ");
        $stmt->execute([':id' => $id]);
        $tournament = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$tournament) {
            Response::error('Tournament not found.', 404);
        }

        // 2. Get Matches
        $stmt = $pdo->prepare("
            SELECT * FROM tournament_matches
            WHERE event_id = :id
            ORDER BY match_time ASC
        ");
        $stmt->execute([':id' => $id]);
        $matches = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Get Full Team Roster with attendance status
        $stmt = $pdo->prepare("
            SELECT a.id, a.full_name, a.jersey_number, a.role,
                   ea.status as attendance_status
            FROM athletes a
            JOIN team_members tm ON a.user_id = tm.user_id AND tm.team_id = :team_id
            LEFT JOIN event_attendees ea ON a.id = ea.athlete_id AND ea.event_id = :event_id
            WHERE a.deleted_at IS NULL AND a.is_active = 1
            ORDER BY a.full_name ASC
        ");
        $stmt->execute([
            ':team_id' => $tournament['team_id'],
            ':event_id' => $id
        ]);
        $roster = $stmt->fetchAll(PDO::FETCH_ASSOC);

        Response::success([
            'tournament' => $tournament,
            'matches' => $matches,
            'roster' => $roster
        ]);
    }

    /**
     * Create or update a tournament
     * POST /api?module=tournaments&action=saveTournament
     */
    public function saveTournament(): void
    {
        $user = Auth::requireWrite('tournaments');
        $body = Response::jsonBody();

        $id = $body['id'] ?? null;
        $team_id = $body['team_id'] ?? null;
        $title = $body['title'] ?? null;
        $event_date = $body['event_date'] ?? null;
        $event_end = $body['event_end'] ?? null;
        $location_name = $body['location_name'] ?? null;

        $website_url = $body['website_url'] ?? null;
        $fee_per_athlete = $body['fee_per_athlete'] ?? 0;
        $accommodation_info = $body['accommodation_info'] ?? null;

        if (!$team_id || !$title || !$event_date) {
            Response::error('Team, Title, and Start Date are required.', 400);
        }

        $pdo = Database::getInstance();

        try {
            $pdo->beginTransaction();

            if (!$id) {
                // Generate unique ID using uniqid to avoid collisions
                $id = 'EVT_' . substr(md5(uniqid('', true)), 0, 8);

                $stmt = $pdo->prepare("
                    INSERT INTO events (id, team_id, type, title, event_date, event_end, location_name, created_by)
                    VALUES (:id, :team_id, 'tournament', :title, :event_date, :event_end, :location_name, :created_by)
                ");
                $stmt->execute([
                    ':id' => $id,
                    ':team_id' => $team_id,
                    ':title' => $title,
                    ':event_date' => $event_date,
                    ':event_end' => $event_end,
                    ':location_name' => $location_name,
                    ':created_by' => $user['id']
                ]);

                $stmt = $pdo->prepare("
                    INSERT INTO tournament_details (event_id, website_url, fee_per_athlete, accommodation_info)
                    VALUES (:id, :website_url, :fee, :acc_info)
                ");
                $stmt->execute([
                    ':id' => $id,
                    ':website_url' => $website_url,
                    ':fee' => $fee_per_athlete,
                    ':acc_info' => $accommodation_info
                ]);

                // Auto-convocate all active athletes from the selected team
                $rosterStmt = $pdo->prepare("
                    SELECT a.id
                    FROM athletes a
                    JOIN team_members tm ON a.user_id = tm.user_id AND tm.team_id = :team_id
                    WHERE a.deleted_at IS NULL AND a.is_active = 1
                ");
                $rosterStmt->execute([':team_id' => $team_id]);
                $athletes = $rosterStmt->fetchAll(PDO::FETCH_COLUMN);

                $attStmt = $pdo->prepare("
                    INSERT INTO event_attendees (id, event_id, athlete_id, status)
                    VALUES (:id, :event_id, :athlete_id, 'confirmed')
                ");
                foreach ($athletes as $athleteId) {
                    $attId = 'ATT_' . substr(md5($id . $athleteId), 0, 8);
                    $attStmt->execute([
                        ':id' => $attId,
                        ':event_id' => $id,
                        ':athlete_id' => $athleteId
                    ]);
                }

            }
            else {
                // Verify the event exists before updating
                $check = $pdo->prepare("SELECT id FROM events WHERE id = :id AND type = 'tournament'");
                $check->execute([':id' => $id]);
                if (!$check->fetch()) {
                    $pdo->rollBack();
                    Response::error('Tournament not found for update.', 404);
                    return;
                }

                // Update
                $stmt = $pdo->prepare("
                    UPDATE events 
                    SET title = :title, event_date = :event_date, event_end = :event_end, location_name = :location_name
                    WHERE id = :id AND type = 'tournament'
                ");
                $stmt->execute([
                    ':id' => $id,
                    ':title' => $title,
                    ':event_date' => $event_date,
                    ':event_end' => $event_end,
                    ':location_name' => $location_name
                ]);

                $stmt = $pdo->prepare("
                    INSERT INTO tournament_details (event_id, website_url, fee_per_athlete, accommodation_info)
                    VALUES (:id, :website_url, :fee, :acc_info)
                    ON DUPLICATE KEY UPDATE 
                        website_url = VALUES(website_url),
                        fee_per_athlete = VALUES(fee_per_athlete),
                        accommodation_info = VALUES(accommodation_info)
                ");
                $stmt->execute([
                    ':id' => $id,
                    ':website_url' => $website_url,
                    ':fee' => $fee_per_athlete,
                    ':acc_info' => $accommodation_info
                ]);
            }

            $pdo->commit();
            Response::success(['id' => $id, 'message' => 'Tournament saved successfully.']);

        }
        catch (\Exception $e) {
            $pdo->rollBack();
            error_log('Error saving tournament: ' . $e->getMessage());
            Response::error('Failed to save tournament: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Update roster attendance for the tournament
     * POST /api?module=tournaments&action=updateRoster
     */
    public function updateRoster(): void
    {
        Auth::requireWrite('tournaments');
        $body = Response::jsonBody();

        $event_id = $body['event_id'] ?? null;
        $attendees = $body['attendees'] ?? []; // Array of { athlete_id: '...', status: 'confirmed' }

        if (!$event_id || !is_array($attendees)) {
            Response::error('Invalid request.', 400);
        }

        $pdo = Database::getInstance();

        try {
            $pdo->beginTransaction();

            $stmt = $pdo->prepare("
                INSERT INTO event_attendees (id, event_id, athlete_id, status)
                VALUES (:id, :event_id, :athlete_id, :status)
                ON DUPLICATE KEY UPDATE status = VALUES(status)
            ");

            foreach ($attendees as $att) {
                $id = 'ATT_' . substr(md5($event_id . $att['athlete_id']), 0, 8);
                $stmt->execute([
                    ':id' => $id,
                    ':event_id' => $event_id,
                    ':athlete_id' => $att['athlete_id'],
                    ':status' => $att['status']
                ]);
            }

            $pdo->commit();
            Response::success(['message' => 'Roster updated successfully.']);

        }
        catch (\Exception $e) {
            $pdo->rollBack();
            Response::error('Failed to update roster.', 500);
        }
    }

    /**
     * Add or update a match
     * POST /api?module=tournaments&action=saveMatch
     */
    public function saveMatch(): void
    {
        Auth::requireWrite('tournaments');
        $body = Response::jsonBody();

        $id = $body['id'] ?? null;
        $event_id = $body['event_id'] ?? null;
        $match_time = $body['match_time'] ?? null;
        $opponent_name = $body['opponent_name'] ?? null;
        $court_name = $body['court_name'] ?? null;
        $our_score = $body['our_score'] ?? 0;
        $opponent_score = $body['opponent_score'] ?? 0;
        $status = $body['status'] ?? 'scheduled';

        if (!$event_id || !$match_time || !$opponent_name) {
            Response::error('Event ID, Match Time, and Opponent Name are required.', 400);
        }

        $pdo = Database::getInstance();

        if (!$id) {
            $id = 'TMT_' . substr(md5((string)time() . $opponent_name), 0, 8);
            $stmt = $pdo->prepare("
                INSERT INTO tournament_matches (id, event_id, match_time, opponent_name, court_name, our_score, opponent_score, status)
                VALUES (:id, :event_id, :match_time, :opponent_name, :court_name, :our_score, :opponent_score, :status)
            ");
        }
        else {
            $stmt = $pdo->prepare("
                UPDATE tournament_matches
                SET match_time = :match_time, opponent_name = :opponent_name, court_name = :court_name,
                    our_score = :our_score, opponent_score = :opponent_score, status = :status
                WHERE id = :id AND event_id = :event_id
            ");
        }

        try {
            $stmt->execute([
                ':id' => $id,
                ':event_id' => $event_id,
                ':match_time' => $match_time,
                ':opponent_name' => $opponent_name,
                ':court_name' => $court_name,
                ':our_score' => $our_score,
                ':opponent_score' => $opponent_score,
                ':status' => $status
            ]);
            Response::success(['id' => $id, 'message' => 'Match saved successfully.']);
        }
        catch (\Exception $e) {
            Response::error('Failed to save match: ' . $e->getMessage(), 500);
        }
    }
}