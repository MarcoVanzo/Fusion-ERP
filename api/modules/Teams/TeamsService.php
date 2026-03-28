<?php
/**
 * Teams Service — Business Logic for Teams and Seasons
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Teams;

use FusionERP\Shared\Audit;
use FusionERP\Shared\TenantContext;

class TeamsService
{
    private TeamsRepository $repo;

    public function __construct()
    {
        $this->repo = new TeamsRepository();
    }

    /**
     * Lists teams grouped with seasons.
     */
    public function listTeams(): array
    {
        return $this->repo->listTeamsWithSeasons(TenantContext::id());
    }

    /**
     * Lists active team seasons for dropdowns.
     */
    public function listActive(): array
    {
        return $this->repo->listActiveTeamSeasons(TenantContext::id());
    }

    /**
     * Creates a new team with an initial season.
     */
    public function createTeam(array $data): array
    {
        $teamId = 'TM_' . bin2hex(random_bytes(4));
        $this->repo->createTeam([
            ':id' => $teamId,
            ':name' => htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8'),
            ':gender' => in_array($data['gender'] ?? '', ['M', 'F']) ? $data['gender'] : null,
            ':category' => htmlspecialchars(trim($data['category'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':color_hex' => $data['color_hex'] ?? '#3B82F6'
        ]);

        $teamSeasonId = 'TS_' . bin2hex(random_bytes(4));
        $this->repo->addTeamSeason([
            ':id' => $teamSeasonId,
            ':team_id' => $teamId,
            ':season' => htmlspecialchars(trim($data['season']), ENT_QUOTES, 'UTF-8')
        ]);

        Audit::log('INSERT', 'teams', $teamId, null, $data);
        return ['id' => $teamId, 'message' => 'Squadra creata con successo'];
    }

    /**
     * Updates an existing team.
     */
    public function updateTeam(array $data): array
    {
        $id = $data['id'] ?? '';
        $tenantId = TenantContext::id();
        $before = $this->repo->getTeamById($id, $tenantId);

        if (!$before) {
            throw new \Exception('Squadra non trovata', 404);
        }

        $this->repo->updateTeam([
            ':id' => $id,
            ':name' => htmlspecialchars(trim($data['name']), ENT_QUOTES, 'UTF-8'),
            ':gender' => in_array($data['gender'] ?? '', ['M', 'F']) ? $data['gender'] : null,
            ':category' => htmlspecialchars(trim($data['category'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':color_hex' => $data['color_hex'] ?? $before['color_hex']
        ]);

        Audit::log('UPDATE', 'teams', $id, $before, $data);
        return ['message' => 'Squadra aggiornata'];
    }

    /**
     * Adds a season to a team.
     */
    public function addSeason(array $data): array
    {
        $teamId = $data['team_id'] ?? '';
        $tenantId = TenantContext::id();
        $team = $this->repo->getTeamById($teamId, $tenantId);

        if (!$team) {
            throw new \Exception('Squadra non trovata', 404);
        }

        try {
            $teamSeasonId = 'TS_' . bin2hex(random_bytes(4));
            $this->repo->addTeamSeason([
                ':id' => $teamSeasonId,
                ':team_id' => $teamId,
                ':season' => htmlspecialchars(trim($data['season']), ENT_QUOTES, 'UTF-8')
            ]);
            
            Audit::log('INSERT', 'team_seasons', $teamSeasonId, null, $data);
            return ['id' => $teamSeasonId, 'message' => 'Stagione aggiunta alla squadra'];
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000' || str_contains($e->getMessage(), 'Duplicate entry')) {
                throw new \Exception('Questa squadra ha già una configurazione per questa stagione.', 400);
            }
            throw $e;
        }
    }

    /**
     * Toggles a team_season active state.
     */
    public function toggleSeason(array $data): array
    {
        $id = $data['id'] ?? '';
        $isActive = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) 
                    ?? ($data['is_active'] === '1' || $data['is_active'] === 1);
        
        $this->repo->toggleTeamSeasonActive($id, $isActive);

        Audit::log('UPDATE', 'team_seasons', $id, null, ['is_active' => $isActive]);
        return ['message' => $isActive ? 'Stagione attivata' : 'Stagione disattivata'];
    }

    /**
     * Removes a team from a season.
     */
    public function deleteSeason(array $data): array
    {
        $teamSeasonId = $data['team_season_id'] ?? '';
        $this->repo->deleteTeamSeason($teamSeasonId);

        Audit::log('DELETE', 'team_seasons', $teamSeasonId, null, null);
        return ['message' => 'Stagione rimossa dalla squadra'];
    }

    /**
     * Soft deletes a team.
     */
    public function deleteTeam(array $data): array
    {
        $id = $data['id'] ?? '';
        $tenantId = TenantContext::id();
        $before = $this->repo->getTeamById($id, $tenantId);
        
        if ($before) {
            $this->repo->softDeleteTeam($id, $tenantId);
            Audit::log('DELETE', 'teams', $id, $before, null);
        }
        
        return ['message' => 'Squadra rimossa'];
    }
}
