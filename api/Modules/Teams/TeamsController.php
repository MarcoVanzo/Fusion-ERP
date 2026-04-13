<?php
/**
 * Teams Controller — Managing Teams and Team Seasons N:N
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Teams;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;

class TeamsController
{
    private TeamsService $service;

    public function __construct()
    {
        $this->service = new TeamsService();
    }

    /**
     * Helper to handle service calls with standard responses.
     */
    private function handleServiceCall(string $method, array $requiredFields = []): void
    {
        try {
            if ($_SERVER['REQUEST_METHOD'] === 'POST') {
                $body = Response::jsonBody();
                if (!empty($requiredFields)) {
                    Response::requireFields($body, $requiredFields);
                }
                Response::success($this->service->$method($body));
            } else {
                Response::success($this->service->$method());
            }
        } catch (\Exception $e) {
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $httpCode);
        }
    }

    // ─── GET /api/?module=teams&action=list ──────────────────────────────────
    public function list(): void
    {
        Auth::requireRead('societa');
        $this->handleServiceCall('listTeams');
    }

    // ─── GET /api/?module=teams&action=listActive ─────────────────────────────
    public function listActive(): void
    {
        Auth::requireRead('societa');
        $this->handleServiceCall('listActive');
    }

    // ─── GET /api/?module=teams&action=listGrouped ────────────────────────────
    public function listGrouped(): void
    {
        $this->list();
    }

    // ─── POST /api/?module=teams&action=create ────────────────────────────────
    public function create(): void
    {
        Auth::requireWrite('societa');
        $this->handleServiceCall('createTeam', ['name', 'category', 'season']);
    }

    // ─── POST /api/?module=teams&action=update ────────────────────────────────
    public function update(): void
    {
        Auth::requireWrite('societa');
        $this->handleServiceCall('updateTeam', ['id', 'name', 'category']);
    }

    // ─── POST /api/?module=teams&action=addSeason ─────────────────────────────
    public function addSeason(): void
    {
        Auth::requireWrite('societa');
        $this->handleServiceCall('addSeason', ['team_id', 'season']);
    }
    
    // ─── POST /api/?module=teams&action=toggleSeason ───────────────────────────
    public function toggleSeason(): void
    {
        Auth::requireWrite('societa');
        $this->handleServiceCall('toggleSeason', ['id', 'is_active']);
    }

    // ─── POST /api/?module=teams&action=deleteSeason ──────────────────────────
    public function deleteSeason(): void
    {
        Auth::requireWrite('societa');
        $this->handleServiceCall('deleteSeason', ['team_season_id']);
    }

    // ─── POST /api/?module=teams&action=delete ────────────────────────────────
    public function delete(): void
    {
        Auth::requireWrite('societa');
        $this->handleServiceCall('deleteTeam', ['id']);
    }

    // ─── POST /api/?module=teams&action=getAttendances ────────────────────────
    public function getAttendances(): void
    {
        Auth::requireRead('societa');
        $this->handleServiceCall('getAttendances');
    }

    // ─── POST /api/?module=teams&action=saveAttendance ────────────────────────
    public function saveAttendance(): void
    {
        Auth::requireWrite('societa');
        $this->handleServiceCall('saveAttendance', ['team_id', 'athlete_id', 'attendance_date', 'status']);
    }
}
