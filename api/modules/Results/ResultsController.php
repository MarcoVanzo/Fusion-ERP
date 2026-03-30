<?php
/**
 * Results Controller - Thin Controller
 * Fusion ERP v1.0 (Refactored to Controller-Service-Repository)
 */

declare(strict_types=1);

namespace FusionERP\Modules\Results;

use FusionERP\Shared\Response;

class ResultsController
{
    private ResultsRepository $repository;
    private ResultsService $service;

    public function __construct()
    {
        $this->repository = new ResultsRepository();
        $this->service = new ResultsService($this->repository);
    }

    /**
     * Centralized helper for service calls
     */
    private function handleServiceCall(callable $callback): void
    {
        try {
            $result = $callback();
            Response::success($result);
        } catch (\Exception $e) {
            error_log("[Results] API Error: " . $e->getMessage());
            Response::error($e->getMessage(), 500);
        }
    }

    public function getCampionati(): void
    {
        $this->handleServiceCall(fn() => [
            'campionati' => $this->repository->getActiveChampionshipsWithTeamFlags()
        ]);
    }

    public function addCampionato(): void
    {
        $body = Response::jsonBody();
        $label = trim($_POST['label'] ?? $body['label'] ?? '');
        $url = trim($_POST['url'] ?? $body['url'] ?? '');

        if (!$label || !$url) {
            Response::error('Nome e URL sono obbligatori.', 400);
        }

        $this->handleServiceCall(function() use ($label, $url) {
            // SSRF and domain validation happens inside service/controller logic if needed,
            // but for now we keep it here as per current implementation
            $id = $this->repository->upsertChampionship(null, $label, $url, '');
            // Auto-sync after adding
            $this->service->syncChampionshipData($id);
            return ['message' => 'Campionato aggiunto.', 'id' => $id];
        });
    }

    public function deleteCampionato(): void
    {
        $body = Response::jsonBody();
        $id = $_POST['id'] ?? $body['id'] ?? null;
        if (!$id) {
            Response::error('ID mancante.', 400);
        }
        
        $this->handleServiceCall(function() use ($id) {
            $count = $this->repository->deleteChampionship($id);
            if ($count === 0) throw new \Exception('Campionato non trovato.');
            return ['message' => 'Campionato eliminato.'];
        });
    }

    public function getResults(): void
    {
        $campionatoId = filter_input(INPUT_GET, 'campionato_id', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        if (!$campionatoId) {
            Response::error('Parametro campionato_id mancante.', 400);
        }

        try {
            $matches = $this->repository->getMatchesByChampionship($campionatoId);
            $lastSync = $this->repository->getChampionshipLastSyncedAt($campionatoId);

            foreach ($matches as &$m) {
                $m['is_our_team'] = $this->service->isOurTeam($m['home_team'], $m['away_team']);
                // Normalize keys for frontend
                $m['home'] = $m['home_team'];
                $m['away'] = $m['away_team'];
                if ($m['home_score'] !== null && $m['away_score'] !== null) {
                    $m['score'] = $m['home_score'] . ' - ' . $m['away_score'];
                } else {
                    $m['score'] = null;
                }
                
                $m['date'] = null;
                $m['time'] = null;
                if ($m['match_date']) {
                    $ts = strtotime($m['match_date']);
                    if ($ts) {
                        $m['date'] = date('d/m/Y', $ts);
                        $m['time'] = date('H:i', $ts);
                        if ($m['time'] === '00:00') $m['time'] = null;
                    }
                }
            }

            Response::success([
                'matches' => $matches,
                'last_updated' => $lastSync,
                'count' => count($matches),
                'source' => 'db'
            ]);
        } catch (\Exception $e) {
            error_log('[Results] getResults error: ' . $e->getMessage());
            Response::error('Errore database', 500);
        }
    }

    public function getStandings(): void
    {
        $campionatoId = filter_input(INPUT_GET, 'campionato_id', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
        if (!$campionatoId) {
            Response::error('Parametro campionato_id mancante.', 400);
        }

        try {
            $standings = $this->repository->getStandingsByChampionship($campionatoId);
            $lastSync = $this->repository->getChampionshipLastSyncedAt($campionatoId);

            foreach ($standings as &$s) {
                $s['is_our_team'] = $this->service->isOurTeam($s['team']);
            }

            Response::success([
                'standings' => $standings,
                'last_updated' => $lastSync,
                'count' => count($standings),
                'source' => 'db'
            ]);
        } catch (\Exception $e) {
            error_log('[Results] getStandings error: ' . $e->getMessage());
            Response::error('Errore database', 500);
        }
    }

    public function recentResults(): void
    {
        $limit = max(1, min(50, (int)(filter_input(INPUT_GET, 'limit', FILTER_SANITIZE_NUMBER_INT) ?? 10)));
        
        try {
            $matches = $this->repository->getRecentMatchesAllChampionships($limit);
            foreach ($matches as &$m) {
                $m['is_our_team'] = $this->service->isOurTeam($m['home'], $m['away']);
            }

            Response::success([
                'matches' => $matches,
                'total' => count($matches),
                'count' => count($matches),
                'last_updated' => date('c'),
                'source' => 'db'
            ]);
        } catch (\PDOException $e) {
            $sqlState = $e->errorInfo[0] ?? (string)$e->getCode();
            if ($sqlState === '42S02' || str_contains($e->getMessage(), "doesn't exist")) {
                $this->repository->applyMigrationsSelfHeal();
                Response::success(['matches' => [], 'total' => 0, 'count' => 0, 'source' => 'db', 'note' => 'schema_ok']);
            }
            error_log('[Results] recentResults error: ' . $e->getMessage());
            Response::error('Errore database', 500);
        }
    }

    public function syncCampionato(): void
    {
        $body = Response::jsonBody();
        $id = $_POST['id'] ?? $body['id'] ?? null;
        if (!$id) {
            Response::error('ID mancante.', 400);
        }

        $result = $this->service->syncChampionshipData($id);
        if ($result['success']) {
            Response::success([
                'message' => 'Sincronizzazione completata',
                'matches' => $result['matches'] ?? 0,
                'standings' => $result['standings'] ?? 0
            ]);
        } else {
            Response::error('Errore di sync: ' . $result['error'], 500);
        }
    }

    public function syncAllCampionati(): void
    {
        set_time_limit(300);
        
        try {
            $camps = $this->repository->getActiveChampionshipsWithTeamFlags();
            $results = [];
            $errors = [];
            
            foreach ($camps as $c) {
                $res = $this->service->syncChampionshipData($c['id']);
                if ($res['success']) {
                    $results[] = [
                        'id' => $c['id'],
                        'label' => $c['label'],
                        'matches' => $res['matches'],
                        'standings' => $res['standings']
                    ];
                } else {
                    $errors[] = [
                        'id' => $c['id'],
                        'label' => $c['label'],
                        'error' => $res['error'] ?? 'Unknown error'
                    ];
                }
            }

            if (empty($errors)) {
                Response::success(['message' => 'Tutti i campionati sono stati aggiornati.', 'details' => $results]);
            } else {
                Response::success(['message' => 'Aggiornamento completato con errori in alcuni campionati.', 'details' => $results, 'errors' => $errors], 207);
            }
        } catch (\Exception $e) {
            Response::error('Errore generale di sincronizzazione', 500);
        }
    }

    public function getPublicRecentResults(): void
    {
        $limit = max(1, min(50, (int)(filter_input(INPUT_GET, 'limit', FILTER_SANITIZE_NUMBER_INT) ?? 10)));
        try {
            $matches = $this->repository->getPublicRecentMatchesAllChampionships($limit);
            foreach ($matches as &$m) {
                $m['is_our_team'] = $this->service->isOurTeam($m['home'], $m['away']);
            }

            Response::success([
                'matches' => $matches,
                'total' => count($matches),
                'last_updated' => date('c'),
                'source' => 'db',
            ]);
        } catch (\PDOException $e) {
            $sqlState = $e->errorInfo[0] ?? (string)$e->getCode();
            if ($sqlState === '42S02') {
                Response::success(['matches' => [], 'total' => 0, 'source' => 'db']);
            }
            Response::error('Errore database', 500);
        }
    }

    public function getPublicMatchCenter(): void
    {
        try {
            $matches = $this->repository->getPublicMatchesCenter();
            foreach ($matches as &$m) {
                $m['is_our_team'] = $this->service->isOurTeam($m['home'], $m['away']);
                $m['score'] = isset($m['sets_home']) ? "{$m['sets_home']} - {$m['sets_away']}" : "vs";
                // Build public-facing logo URLs
                $m['home_logo_url'] = $m['home_logo'] ? ('/ERP/' . ltrim($m['home_logo'], '/')) : null;
                $m['away_logo_url'] = $m['away_logo'] ? ('/ERP/' . ltrim($m['away_logo'], '/')) : null;
                unset($m['home_logo'], $m['away_logo']);
            }

            $standingsRaw = $this->repository->getPublicStandingsCenter();
            $standings = [];
            foreach ($standingsRaw as $row) {
                $cid = $row['championship_id'];
                if (!isset($standings[$cid])) {
                    $standings[$cid] = [
                        'championship_id' => $cid,
                        'championship_label' => $row['championship_label'],
                        'rows' => []
                    ];
                }
                $row['is_our_team'] = $this->service->isOurTeam($row['team']);
                $standings[$cid]['rows'][] = $row;
            }

            Response::success([
                'matches' => $matches,
                'standings' => array_values($standings),
                'last_updated' => date('c'),
                'source' => 'db',
            ]);
        } catch (\PDOException $e) {
            $sqlState = $e->errorInfo[0] ?? (string)$e->getCode();
            if ($sqlState === '42S02') {
                Response::success(['matches' => [], 'standings' => [], 'source' => 'db']);
            }
            Response::error('Errore database', 500);
        }
    }
}