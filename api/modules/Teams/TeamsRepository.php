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
             WHERE tenant_id = :tenant_id AND deleted_at IS NULL 
             ORDER BY category, name'
        );
        $stmtTeams->execute([':tenant_id' => $tenantId]);
        $teams = $stmtTeams->fetchAll(\PDO::FETCH_ASSOC);

        if (empty($teams)) {
            return [];
        }

        // 2. Get all seasons for these teams
        $teamIds = array_column($teams, 'id');
        $inQuery = implode(',', array_fill(0, count($teamIds), '?'));
        
        $stmtSeasons = $this->db->prepare(
            "SELECT id AS team_season_id, team_id, season 
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
                'season' => $s['season']
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
             WHERE t.tenant_id = :tenant_id AND t.deleted_at IS NULL AND t.is_active = 1
             ORDER BY ts.season DESC, t.category, t.name'
        );
        $stmt->execute([':tenant_id' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getTeamById(string $teamId, string $tenantId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, name, category, color_hex, is_active 
             FROM teams 
             WHERE id = :id AND tenant_id = :tenant_id AND deleted_at IS NULL'
        );
        $stmt->execute([':id' => $teamId, ':tenant_id' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createTeam(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO teams (id, tenant_id, name, category, color_hex) 
             VALUES (:id, :tenant_id, :name, :category, :color_hex)'
        );
        $stmt->execute($data);
    }

    public function updateTeam(array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE teams 
             SET name = :name, category = :category, color_hex = :color_hex 
             WHERE id = :id AND tenant_id = :tenant_id AND deleted_at IS NULL'
        );
        $stmt->execute($data);
    }

    public function softDeleteTeam(string $teamId, string $tenantId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE teams SET deleted_at = NOW() WHERE id = :id AND tenant_id = :tenant_id'
        );
        $stmt->execute([':id' => $teamId, ':tenant_id' => $tenantId]);
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
}
