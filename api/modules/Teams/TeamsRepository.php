<?php
/**
 * Teams Repository — DB Queries for Teams and Team Seasons
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Teams;

use FusionERP\Shared\Database;

class TeamsRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Gets all teams, grouping their active seasons under each team.
     * This is useful for the administration interface.
     */
    public function listTeamsWithSeasons(string $tenantId): array
    {
        // 1. Get all teams
        $stmtTeams = $this->db->prepare(
            'SELECT id, name, category, color_hex, is_active 
             FROM teams 
             WHERE deleted_at IS NULL 
             ORDER BY category, name'
        );
        $stmtTeams->execute();
        $teams = $stmtTeams->fetchAll(\PDO::FETCH_ASSOC);

        if (empty($teams)) {
            return [];
        }

        // 2. Get all seasons for these teams
        $teamIds = array_column($teams, 'id');
        $inQuery = implode(',', array_fill(0, count($teamIds), '?'));
        
        $stmtSeasons = $this->db->prepare(
            "SELECT id AS team_season_id, team_id, season, is_active 
             FROM team_seasons 
             WHERE team_id IN ($inQuery) 
             ORDER BY season DESC"
        );
        $stmtSeasons->execute($teamIds);
        $seasons = $stmtSeasons->fetchAll(\PDO::FETCH_ASSOC);

        // 3. Group seasons by team_id
        $seasonsByTeam = [];
        foreach ($seasons as $s) {
            $seasonsByTeam[$s['team_id']][] = [
                'id' => $s['team_season_id'],
                'season' => $s['season'],
                'is_active' => (int)$s['is_active']
            ];
        }

        // 4. Attach seasons to teams
        foreach ($teams as &$t) {
            $t['seasons'] = $seasonsByTeam[$t['id']] ?? [];
        }

        return $teams;
    }

    /**
     * Used by dropdowns to list active team seasons.
     */
    public function listActiveTeamSeasons(string $tenantId): array
    {
        $stmt = $this->db->prepare(
            'SELECT ts.id AS team_season_id, t.id AS team_id, t.name, t.category, ts.season 
             FROM team_seasons ts
             JOIN teams t ON ts.team_id = t.id
             WHERE t.deleted_at IS NULL AND t.is_active = 1
             ORDER BY ts.season DESC, t.category, t.name'
        );
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getTeamById(string $teamId, string $tenantId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, category, color_hex, is_active 
             FROM teams 
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([':id' => $teamId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createTeam(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO teams (id, name, gender, category, color_hex) 
             VALUES (:id, :name, :gender, :category, :color_hex)'
        );
        $stmt->execute($data);
    }

    public function updateTeam(array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE teams 
             SET name = :name, gender = :gender, category = :category, color_hex = :color_hex 
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute($data);
    }

    public function softDeleteTeam(string $teamId, string $tenantId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE teams SET deleted_at = NOW() WHERE id = :id'
        );
        $stmt->execute([':id' => $teamId]);
    }

    public function addTeamSeason(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO team_seasons (id, team_id, season) VALUES (:id, :team_id, :season)'
        );
        $stmt->execute($data);
    }
    
    public function deleteTeamSeason(string $teamSeasonId): void
    {
        $stmt = $this->db->prepare(
            'DELETE FROM team_seasons WHERE id = :id'
        );
        $stmt->execute([':id' => $teamSeasonId]);
    }

    public function toggleTeamSeasonActive(string $teamSeasonId, bool $isActive): void
    {
        $stmt = $this->db->prepare(
            'UPDATE team_seasons SET is_active = :is_active WHERE id = :id'
        );
        $stmt->execute([':is_active' => $isActive ? 1 : 0, ':id' => $teamSeasonId]);
    }
}
