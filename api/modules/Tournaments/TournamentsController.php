<?php
/**
 * Tournaments Controller - Thin Controller
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tournaments;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;

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
}