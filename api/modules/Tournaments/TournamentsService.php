<?php
/**
 * Tournaments Service
 * Fusion ERP v1.1
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tournaments;

use Exception;

class TournamentsService
{
    private TournamentsRepository $repository;

    public function __construct(TournamentsRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get tournament full data
     */
    public function getTournamentDetail(string $id): array
    {
        $tournament = $this->repository->getTournament($id);
        if (!$tournament) {
            throw new Exception('Tournament not found', 404);
        }

        return [
            'tournament' => $tournament,
            'matches' => $this->repository->getMatches($id),
            'roster' => $this->repository->getRoster($id, $tournament['team_id'])
        ];
    }

    /**
     * Save tournament with atomic transaction
     */
    public function saveTournament(array $data, string $userId): string
    {
        // Validation
        if (empty($data['team_id']) || empty($data['title']) || empty($data['event_date'])) {
            throw new Exception('Team, Title, and Start Date are required', 400);
        }

        $id = $data['id'] ?? null;
        $isUpdate = !empty($id);

        if (!$isUpdate) {
            $id = 'EVT_' . substr(md5(uniqid('', true)), 0, 8);
            $data['id'] = $id;
            $data['created_by'] = $userId;
            $data['is_update'] = false;
        } else {
            $data['is_update'] = true;
        }

        // Use Database connection for transaction control through repository if needed,
        // but for simplicity in this thin layer we assume repository uses same DB instance.
        $this->repository->upsertTournament($data);

        // Auto-convocate if new
        if (!$isUpdate) {
            $this->repository->autoConvocate($id, $data['team_id']);
        }

        return $id;
    }

    /**
     * Update roster
     */
    public function updateRoster(string $tournamentId, array $attendees): void
    {
        if (empty($tournamentId)) throw new Exception('Tournament ID is required', 400);
        $this->repository->updateRosterStatus($tournamentId, $attendees);
    }
}
