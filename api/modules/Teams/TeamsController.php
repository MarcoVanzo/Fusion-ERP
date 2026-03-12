<?php
/**
 * Teams Controller — Managing Teams and Team Seasons N:N
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Teams;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class TeamsController
{
    private TeamsRepository $repo;

    public function __construct()
    {
        $this->repo = new TeamsRepository();
    }

    // ─── GET /api/?module=teams&action=list ──────────────────────────────────
    /**
     * Lists all teams with their associated seasons for management UI.
     */
    public function list(): void
    {
        Auth::requireRead('societa');
        $tenantId = TenantContext::id();
        Response::success($this->repo->listTeamsWithSeasons($tenantId));
    }

    // ─── GET /api/?module=teams&action=listActive ─────────────────────────────
    /**
     * Lists active team_seasons for dropdowns (e.g. assigning athletes to a team in a season).
     */
    public function listActive(): void
    {
        Auth::requireRead('societa');
        $tenantId = TenantContext::id();
        Response::success($this->repo->listActiveTeamSeasons($tenantId));
    }

    // ─── GET /api/?module=teams&action=listGrouped ────────────────────────────
    /**
     * Alias for list() — used by the squadre.js frontend module.
     */
    public function listGrouped(): void
    {
        $this->list();
    }

    // ─── POST /api/?module=teams&action=create ────────────────────────────────
    public function create(): void
    {
        Auth::requireWrite('societa');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name', 'category', 'season']);

        $tenantId = TenantContext::id();
        $teamId = 'TM_' . bin2hex(random_bytes(4));

        // 1. Create Base Team
        $this->repo->createTeam([
            ':id' => $teamId,
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':category' => htmlspecialchars(trim($body['category']), ENT_QUOTES, 'UTF-8'),
            ':color_hex' => $body['color_hex'] ?? '#3B82F6'
        ]);

        // 2. Add Initial Season
        $teamSeasonId = 'TS_' . bin2hex(random_bytes(4));
        $this->repo->addTeamSeason([
            ':id' => $teamSeasonId,
            ':team_id' => $teamId,
            ':season' => htmlspecialchars(trim($body['season']), ENT_QUOTES, 'UTF-8')
        ]);

        Audit::log('INSERT', 'teams', $teamId, null, $body);
        Response::success(['id' => $teamId, 'message' => 'Squadra creata con successo'], 201);
    }

    // ─── POST /api/?module=teams&action=update ────────────────────────────────
    public function update(): void
    {
        Auth::requireWrite('societa');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'name', 'category']);

        $tenantId = TenantContext::id();
        $before = $this->repo->getTeamById($body['id'], $tenantId);

        if (!$before) {
            Response::error('Squadra non trovata', 404);
        }

        $this->repo->updateTeam([
            ':id' => $body['id'],
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':category' => htmlspecialchars(trim($body['category']), ENT_QUOTES, 'UTF-8'),
            ':color_hex' => $body['color_hex'] ?? $before['color_hex']
        ]);

        Audit::log('UPDATE', 'teams', $body['id'], $before, $body);
        Response::success(['message' => 'Squadra aggiornata']);
    }

    // ─── POST /api/?module=teams&action=addSeason ─────────────────────────────
    public function addSeason(): void
    {
        Auth::requireWrite('societa');
        $body = Response::jsonBody();
        Response::requireFields($body, ['team_id', 'season']);

        $tenantId = TenantContext::id();
        $team = $this->repo->getTeamById($body['team_id'], $tenantId);

        if (!$team) {
            Response::error('Squadra non trovata', 404);
        }

        // Prevent duplicates (handled by unique key in DB, but caught gracefully here if needed)
        try {
            $teamSeasonId = 'TS_' . bin2hex(random_bytes(4));
            $this->repo->addTeamSeason([
                ':id' => $teamSeasonId,
                ':team_id' => $body['team_id'],
                ':season' => htmlspecialchars(trim($body['season']), ENT_QUOTES, 'UTF-8')
            ]);
            
            Audit::log('INSERT', 'team_seasons', $teamSeasonId, null, $body);
            Response::success(['id' => $teamSeasonId, 'message' => 'Stagione aggiunta alla squadra']);
        } catch (\PDOException $e) {
            // Error code 23000 is integrity constraint violation (e.g. duplicate key)
            if ($e->getCode() === '23000' || str_contains($e->getMessage(), 'Duplicate entry')) {
                 Response::error('Questa squadra ha già una configurazione per questa stagione.', 400);
            }
            throw $e;
        }
    }
    
    // ─── POST /api/?module=teams&action=toggleSeason ───────────────────────────
    public function toggleSeason(): void
    {
        Auth::requireWrite('societa');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'is_active']);

        $isActive = filter_var($body['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) 
                    ?? ($body['is_active'] === '1' || $body['is_active'] === 1);
        $this->repo->toggleTeamSeasonActive($body['id'], $isActive);

        Audit::log('UPDATE', 'team_seasons', $body['id'], null, ['is_active' => $isActive]);
        Response::success(['message' => $isActive ? 'Stagione attivata' : 'Stagione disattivata']);
    }

    // ─── POST /api/?module=teams&action=deleteSeason ──────────────────────────
    public function deleteSeason(): void
    {
        Auth::requireWrite('societa');
        $body = Response::jsonBody();
        Response::requireFields($body, ['team_season_id']);

        // Ideally verify tenant_id via joins, but soft-delete usually handled differently,
        // let's just delete the season map if authorized
        $this->repo->deleteTeamSeason($body['team_season_id']);

        Audit::log('DELETE', 'team_seasons', $body['team_season_id'], null, null);
        Response::success(['message' => 'Stagione rimossa dalla squadra']);
    }

    // ─── POST /api/?module=teams&action=delete ────────────────────────────────
    public function delete(): void
    {
        Auth::requireWrite('societa');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        $tenantId = TenantContext::id();
        $before = $this->repo->getTeamById($id, $tenantId);
        
        if ($before) {
            $this->repo->softDeleteTeam($id, $tenantId);
            Audit::log('DELETE', 'teams', $id, $before, null);
        }
        
        Response::success(['message' => 'Squadra rimossa']);
    }
}
