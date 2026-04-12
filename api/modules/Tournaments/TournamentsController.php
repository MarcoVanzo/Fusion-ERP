<?php
/**
 * Tournaments Controller - Thin Controller
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tournaments;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;

require_once __DIR__ . '/Services/TournamentsPdfService.php';
require_once dirname(__DIR__) . '/Societa/SocietaRepository.php';

class TournamentsController
{
    private TournamentsRepository $repository;
    private TournamentsService $service;

    public function __construct()
    {
        $this->repository = new TournamentsRepository();
        $this->service = new TournamentsService($this->repository);
    }

    /**
     * Standardized helper for service calls
     */
    private function handleServiceCall(callable $callback): void
    {
        try {
            $result = $callback();
            Response::success($result);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $httpCode = ($code >= 400 && $code < 600) ? $code : 500;
            error_log("[Tournaments] API Error ({$httpCode}): " . $e->getMessage());
            Response::error($e->getMessage(), $httpCode);
        }
    }

    public function getTournaments(): void
    {
        Auth::requireRead('tournaments');
        $tournaments = $this->repository->listTournaments();
        
        // Debug logging to trace "empty list" issues in production
        if (getenv('APP_DEBUG') === 'true') {
            $count = count($tournaments);
            $tid = \FusionERP\Shared\TenantContext::id();
            error_log("[Tournaments] Found {$count} tournaments for tenant '{$tid}' (incl. global)");
        }

        $this->handleServiceCall(fn() => [
            'tournaments' => $tournaments
        ]);
    }

    public function getTournament(): void
    {
        Auth::requireRead('tournaments');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT);
        if (!$id) {
            Response::error('Invalid tournament ID.', 400);
        }

        $this->handleServiceCall(fn() => $this->service->getTournamentDetail($id));
    }

    public function saveTournament(): void
    {
        $user = Auth::requireWrite('tournaments');
        $body = Response::jsonBody();
        
        $this->handleServiceCall(fn() => [
            'id' => $this->service->saveTournament($body, $user['id']),
            'message' => 'Tournament saved successfully.'
        ]);
    }

    public function updateRoster(): void
    {
        Auth::requireWrite('tournaments');
        $body = Response::jsonBody();
        $event_id = $body['event_id'] ?? null;
        $attendees = $body['attendees'] ?? [];

        $this->handleServiceCall(function() use ($event_id, $attendees) {
            $this->service->updateRoster($event_id, $attendees);
            return ['message' => 'Roster updated successfully.'];
        });
    }

    public function saveMatch(): void
    {
        Auth::requireWrite('tournaments');
        $body = Response::jsonBody();
        
        $this->handleServiceCall(function() use ($body) {
            $this->repository->saveMatch($body);
            return ['message' => 'Match saved successfully.'];
        });
    }

    public function deleteTournament(): void
    {
        Auth::requireWrite('tournaments');
        $body = Response::jsonBody();
        $id = $body['id'] ?? filter_input(INPUT_GET, 'id', FILTER_DEFAULT);
        
        $this->handleServiceCall(function() use ($id) {
            $this->service->deleteTournament($id);
            return ['message' => 'Tournament deleted successfully.'];
        });
    }

    public function duplicateTournament(): void
    {
        $user = Auth::requireWrite('tournaments');
        $body = Response::jsonBody();
        $id = $body['id'] ?? filter_input(INPUT_GET, 'id', FILTER_DEFAULT);
        
        $this->handleServiceCall(function() use ($id, $user) {
            $newId = $this->service->duplicateTournament($id, $user['id']);
            return [
                'id' => $newId,
                'message' => 'Tournament duplicated successfully.'
            ];
        });
    }

    public function saveExpense(): void
    {
        Auth::requireWrite('tournaments');
        $body = Response::jsonBody();
        
        $this->handleServiceCall(function() use ($body) {
            $this->repository->saveExpense($body);
            return ['message' => 'Expense saved successfully.'];
        });
    }

    public function deleteExpense(): void
    {
        Auth::requireWrite('tournaments');
        $body = Response::jsonBody();
        $id = $body['id'] ?? null;
        
        $this->handleServiceCall(function() use ($id) {
            if (!$id) throw new \Exception('Expense ID required', 400);
            $this->repository->deleteExpense($id);
            return ['message' => 'Expense deleted successfully.'];
        });
    }

    /**
     * PDF Export: Rooming List
     */
    public function generateRoomingList(): void
    {
        Auth::requireRead('tournaments');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT);
        if (!$id) {
            Response::error('Invalid tournament ID.', 400);
        }

        try {
            $tournament = $this->repository->getTournament($id);
            if (!$tournament) throw new \Exception('Tournament not found', 404);

            $roster = $this->repository->getRoster($id, $tournament['team_id']);

            $socRepo = new \FusionERP\Modules\Societa\SocietaRepository();
            $socProfile = $socRepo->getProfile() ?: [];

            $pdfService = new \FusionERP\Modules\Tournaments\Services\TournamentsPdfService();
            $pdfService->generateRoomingList($tournament, $roster, $socProfile);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), (int)$e->getCode() ?: 500);
        }
    }

    /**
     * Save Rooming List PDF to disk
     */
    public function saveRoomingList(): void
    {
        Auth::requireWrite('tournaments');
        $id = filter_input(INPUT_POST, 'id', FILTER_DEFAULT);
        if (!$id) {
            Response::error('Invalid tournament ID.', 400);
        }

        try {
            $tournament = $this->repository->getTournament($id);
            if (!$tournament) throw new \Exception('Tournament not found', 404);

            $roster = $this->repository->getRoster($id, $tournament['team_id']);
            
            $socRepo = new \FusionERP\Modules\Societa\SocietaRepository();
            $socProfile = $socRepo->getProfile() ?: [];

            // Define path
            $dir = dirname(__DIR__, 3) . '/uploads/rooming_lists/';
            if (!is_dir($dir)) mkdir($dir, 0775, true);
            
            $filename = 'Rooming_List_' . $id . '.pdf';
            $fullPath = $dir . $filename;
            $relativePath = 'uploads/rooming_lists/' . $filename;

            // Generate and save
            $pdfService = new \FusionERP\Modules\Tournaments\Services\TournamentsPdfService();
            $pdfService->generateRoomingList($tournament, $roster, $socProfile, $fullPath);

            // Update DB
            $this->repository->updateRoomingListPath($id, $relativePath);

            Response::success(['path' => $relativePath]);
        } catch (\Exception $e) {
            Response::error($e->getMessage(), (int)$e->getCode() ?: 500);
        }
    }
}