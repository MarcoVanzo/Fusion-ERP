<?php
/**
 * ValdController — API Endpoints for VALD Integration
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Vald;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class ValdController
{
    private ValdRepository $repo;
    private ValdService $service;

    public function __construct()
    {
        $this->repo = new ValdRepository();
        $this->service = new ValdService($this->repo);
    }

    /**
     * POST /api/?module=vald&action=adminReset
     */
    public function adminReset(): void
    {
        Auth::requireRole('admin');
        $tenantId = TenantContext::id();
        $db = \FusionERP\Shared\Database::getInstance();

        $del = $db->prepare('DELETE FROM vald_test_results WHERE tenant_id = :tid');
        $del->execute([':tid' => $tenantId]);
        $deleted = $del->rowCount();

        $unlink = $db->prepare('UPDATE athletes SET vald_profile_id = NULL WHERE tenant_id = :tid');
        $unlink->execute([':tid' => $tenantId]);
        $unlinked = $unlink->rowCount();

        Response::success([
            'deleted_tests' => $deleted,
            'unlinked_athletes' => $unlinked,
            'message' => 'Reset completato: ' . $deleted . ' test eliminati, ' . $unlinked . ' atleti sganciati.',
        ]);
    }

    /**
     * GET /api/?module=vald&action=results&athleteId=ATH_xxx
     */
    public function results(): void
    {
        Auth::requireRead('athletes');
        $athleteId = filter_input(INPUT_GET, 'athleteId', FILTER_DEFAULT) ?? '';

        if (empty($athleteId)) {
            Response::error('athleteId obbligatorio', 400);
        }

        $results = $this->repo->getResultsByAthlete($athleteId);
        foreach ($results as &$res) {
            if (isset($res['metrics'])) {
                $res['metrics'] = json_decode($res['metrics'], true);
            }
        }
        Response::success($results);
    }

    /**
     * GET /api/?module=vald&action=analytics&athleteId=ATH_xxx
     */
    public function analytics(): void
    {
        try {
            Auth::requireRead('athletes');
            $athleteId = filter_input(INPUT_GET, 'athleteId', FILTER_DEFAULT) ?? '';

            if (empty($athleteId)) {
                Response::error('athleteId obbligatorio', 400);
            }

            $latest = $this->repo->getLatestResult($athleteId);
            if (!$latest) {
                Response::success([
                    'hasData' => false,
                    'semaphore' => null,
                    'asymmetry' => null,
                    'profile' => null,
                    'ranking' => [],
                    'coachMessage' => 'Nessun dato VALD disponibile per questo atleta.',
                ]);
            }

            $metrics = json_decode($latest['metrics'] ?? '{}', true) ?: [];
            $baseline = $this->repo->getBaselineMetrics($athleteId);
            
            $semaphore = $this->service->computeSemaphore($metrics, $baseline);
            $asymmetry = $this->service->computeAsymmetry($metrics);
            $muscleMap = $this->service->computeMuscleMap($semaphore, $asymmetry);
            
            $athleteWeight = (float)$this->service->getAthleteWeight($athleteId);
            $profile = $this->service->computeProfile($metrics, $athleteWeight);

            // Fetch Deep Analytics (Python Processor)
            $deep = $this->service->getDeepAnalytics($athleteId);

            $allResults = $this->repo->getResultsByAthlete($athleteId);
            foreach ($allResults as &$res) {
                if (isset($res['metrics'])) {
                    $res['metrics'] = json_decode($res['metrics'], true);
                    $res['asymmetry'] = $this->service->computeAsymmetry($res['metrics'] ?: []);
                }
            }

            $baselineBraking = $this->repo->getBaselineBrakingImpulse($athleteId);

            Response::success([
                'hasData' => true,
                'testDate' => $latest['test_date'],
                'testType' => $latest['test_type'],
                'jumpHeight' => $deep['Jump Height (Imp-Mom) (cm)'] ?? $profile['jumpHeight'] ?? null,
                'jhTrend' => $deep['Jump Height (Imp-Mom) (cm)_zscore'] ?? 0,
                'peakPowerBM' => $this->_computeRelativePeakPower($deep, $metrics, $athleteWeight),
                'rsiZScore' => $deep['RSI-modified_zscore'] ?? null,
                'strategyShiftAlert' => $deep['Strategy_Shift_Alert'] ?? null,
                'brakingImpulse' => $profile['brakingImpulse'] ?? null,
                'asymmetryPct' => $asymmetry['landing']['asymmetry'] ?? null,
                'baselineBraking' => $baselineBraking,
                'semaphore' => $semaphore,
                'asymmetry' => $asymmetry,
                'profile' => $profile,
                'muscleMap' => $muscleMap,
                'results' => $allResults,
            ]);
        } catch (\Throwable $e) {
            Response::error('Critico VALD: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Compute Relative Peak Power (W/kg) with fallback chain:
     * 1. Deep analytics per-BM value (already in W/kg)
     * 2. Deep analytics absolute power / athlete weight
     * 3. Latest metrics ConcentricPeakPowerBM (already in W/kg)
     * 4. Latest metrics ConcentricPeakPower / athlete weight
     * 5. Physics estimate from JumpHeight + BM (Harman equation)
     */
    private function _computeRelativePeakPower(?array $deep, array $metrics, float $athleteWeight): float
    {
        // 1. Direct per-BM value from deep analytics
        $perBM = (float)($deep['Concentric Peak Power / BM (W/kg)'] ?? 0);
        if ($perBM > 0) return round($perBM, 1);

        // 2. Absolute power from deep analytics / weight
        $absW = (float)($deep['Concentric Peak Power (W)'] ?? 0);
        if ($absW > 0 && $athleteWeight > 0) return round($absW / $athleteWeight, 1);

        // 3. ConcentricPeakPowerBM from raw metrics (already W/kg)
        $rawBM = (float)($metrics['ConcentricPeakPowerBM']['Value'] ?? 0);
        if ($rawBM > 0) return round($rawBM, 1);

        // 4. ConcentricPeakPower (absolute W) from raw metrics / weight
        $rawAbs = (float)($metrics['ConcentricPeakPower']['Value'] ?? 0);
        if ($rawAbs > 0 && $athleteWeight > 0) return round($rawAbs / $athleteWeight, 1);

        // 5. Physics-based estimate: Harman equation (validated for CMJ)
        //    PPeak (W) = 61.9 × JH_cm + 36.0 × BM_kg − 1822
        //    Relative = PPeak / BM
        $jhCm = (float)($deep['Jump Height (Imp-Mom) (cm)'] ?? $metrics['JumpHeight']['Value'] ?? $metrics['JumpHeightTotal']['Value'] ?? 0);
        if ($jhCm > 0 && $athleteWeight > 0) {
            $peakPowerW = 61.9 * $jhCm + 36.0 * $athleteWeight - 1822;
            if ($peakPowerW > 0) {
                return round($peakPowerW / $athleteWeight, 1);
            }
        }

        return 0;
    }

    /**
     * GET /api/?module=vald&action=aiAnalysis&athleteId=X&part=diagnosis|plan
     */
    public function aiAnalysis(): void
    {
        try {
            set_time_limit(120);
            Auth::requireRead('athletes');
            $athleteId = filter_input(INPUT_GET, 'athleteId', FILTER_DEFAULT) ?? '';
            $part      = filter_input(INPUT_GET, 'part', FILTER_DEFAULT) ?? 'diagnosis';

            if (empty($athleteId)) { Response::error('athleteId obbligatorio', 400); }

            $latest = $this->repo->getLatestResult($athleteId);
            if (!$latest) { Response::success(['text' => 'Nessun dato VALD disponibile.']); }

            $metrics   = json_decode($latest['metrics'] ?? '{}', true) ?: [];
            $baseline  = $this->repo->getBaselineMetrics($athleteId);
            $semaphore = $this->service->computeSemaphore($metrics, $baseline);
            $asymmetry = $this->service->computeAsymmetry($metrics);
            $weight    = $this->service->getAthleteWeight($athleteId);
            $profile   = $this->service->computeProfile($metrics, $weight);
            $history   = array_slice($this->repo->getResultsByAthlete($athleteId), 0, 5);

            $prompt = $this->service->buildValdPrompt($semaphore, $asymmetry, $profile, $history, $part);
            $text   = $this->service->callGeminiSingle($prompt);

            Response::success(['text' => $text, 'part' => $part]);
        } catch (\Throwable $e) {
            Response::error('AI: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/?module=vald&action=aiChat
     */
    public function aiChat(): void
    {
        try {
            set_time_limit(120);
            Auth::requireRead('athletes');
            $body      = json_decode(file_get_contents('php://input'), true) ?? [];
            $athleteId = filter_var($body['athleteId'] ?? '', FILTER_DEFAULT);
            $question  = trim($body['question'] ?? '');
            $context   = trim($body['context'] ?? '');

            if (empty($athleteId) || empty($question)) {
                Response::error('athleteId e question obbligatori', 400);
            }

            $latest = $this->repo->getLatestResult($athleteId);
            $valdCtx = '';
            if ($latest) {
                $metrics   = json_decode($latest['metrics'] ?? '{}', true) ?: [];
                $baseline  = $this->repo->getBaselineMetrics($athleteId);
                $semaphore = $this->service->computeSemaphore($metrics, $baseline);
                $weight    = $this->service->getAthleteWeight($athleteId);
                $profile   = $this->service->computeProfile($metrics, $weight);
                
                $rsiCur = round((float)($semaphore['rsimod']['current'] ?? 0), 3);
                $rsiVar = round((float)($semaphore['rsimod']['variation'] ?? 0), 1);
                $jh     = round((float)($profile['jumpHeight'] ?? 0), 1);
                $bi     = round((float)($profile['brakingImpulse'] ?? 0), 1);
                
                $valdCtx = sprintf("DATI VALD ATLETA (test del %s): RSImod=%.3f (%.1f%%, stato=%s), JumpHeight=%.1fcm, BrakingImpulse=%.1f N\u00b7s/kg.", 
                                  $latest['test_date'], $rsiCur, $rsiVar, $semaphore['status'] ?? 'N/A', $jh, $bi);
            }

            $contextBlock = $context ? "\n\nCONTESTO ANALISI AI PRECEDENTE:\n{$context}" : '';

            $prompt = <<<PROMPT
Sei il miglior preparatore atletico al mondo specializzato in pallavolo giovanile di club.
Hai 25 anni di esperienza con squadre giovanili U13-U20, conosci ForceDecks/VALD, prevenzione infortuni e programmazione del carico in-season.
Necessita' di non fermare l'atleta se non come ultima possibilita'.

CONTESTO SQUADRA: giovani pallavoliste di club che si allenano 6 giorni su 7 per circa 3 ore al giorno.
{$valdCtx}{$contextBlock}

DOMANDA DEL COACH:
{$question}

Rispondi in italiano, in modo pratico e diretto (max 1000 parole). Consigli concreti e applicabili immediatamente. Solo testo, no JSON, no markdown.
PROMPT;

            $text = $this->service->callGeminiSingle($prompt);
            Response::success(['answer' => $text]);
        } catch (\Throwable $e) {
            Response::error('Chat AI: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/?module=vald&action=teamRanking
     */
    public function teamRanking(): void
    {
        Auth::requireRead('athletes');
        Response::success($this->repo->getTeamRanking(10));
    }

    /**
     * GET /api/?module=vald&action=valdAthletes
     */
    public function valdAthletes(): void
    {
        Auth::requireRead('athletes');
        $tenantId = TenantContext::id();
        $db = \FusionERP\Shared\Database::getInstance();

        try {
            $valdAthletes = $this->service->getAthletes();
        } catch (\Throwable $e) {
            $msg = strpos($e->getMessage(), 'Access Token') !== false
                ? 'Autenticazione VALD fallita. Verifica VALD_CLIENT_ID e VALD_CLIENT_SECRET nel file .env.'
                : 'Errore API: ' . $e->getMessage();
            Response::error($msg, 502);
        }

        if (!is_array($valdAthletes)) {
            Response::error('API non valida', 502);
        }

        $stmt = $db->prepare(
            'SELECT a.id, a.full_name, a.vald_profile_id, COALESCE(t.name, \'\') AS team_name
             FROM athletes a LEFT JOIN teams t ON t.id = a.team_id
             WHERE a.tenant_id = :tid AND a.deleted_at IS NULL GROUP BY a.id ORDER BY a.full_name'
        );
        $stmt->execute([':tid' => $tenantId]);
        $erpAthletes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $erpByValdId = []; $erpByName = [];
        foreach ($erpAthletes as $a) {
            if ($a['vald_profile_id'] && !isset($erpByValdId[$a['vald_profile_id']])) {
                $erpByValdId[$a['vald_profile_id']] = $a;
            }
            $norm = str_replace(['à','è','é','ì','ò','ù'], ['a','e','e','i','o','u'], mb_strtolower(trim($a['full_name'])));
            if (!isset($erpByName[$norm]) || $a['vald_profile_id']) {
                $erpByName[$norm] = $a;
            }
        }

        $result = [];
        foreach ($valdAthletes as $va) {
            $vId = $va['id'];
            $vName = $va['name'] ?? trim(($va['givenName'] ?? '') . ' ' . ($va['familyName'] ?? ''));
            $linked = $erpByValdId[$vId] ?? null;
            $suggestion = null;

            if (!$linked) {
                $norm = str_replace(['à','è','é','ì','ò','ù'], ['a','e','e','i','o','u'], mb_strtolower(trim($vName)));
                $suggestion = $erpByName[$norm] ?? null;
                if (!$suggestion) {
                    $parts = explode(' ', $norm);
                    $suggestion = $erpByName[implode(' ', array_reverse($parts))] ?? null;
                }
            }

            $result[] = [
                'vald_id' => $vId, 'vald_name' => $vName,
                'vald_category' => $va['attributes'][0]['valueName'] ?? null,
                'linked_erp_id' => $linked['id'] ?? null, 'linked_erp_name' => $linked['full_name'] ?? null,
                'suggested_erp_id' => $suggestion['id'] ?? null, 'suggested_erp_name' => $suggestion['full_name'] ?? null,
            ];
        }

        $erpDropdown = array_values(array_map(function ($a) {
            return ['id' => $a['id'], 'name' => $a['full_name'] . ($a['team_name'] ? ' — ' . $a['team_name'] : '')];
        }, $erpAthletes));

        Response::success(['valdAthletes' => $result, 'erpAthletes' => $erpDropdown]);
    }

    /**
     * POST /api/?module=vald&action=linkAthlete
     */
    public function linkAthlete(): void
    {
        Auth::requireWrite('athletes');
        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body) || empty($body)) {
            Response::error('Body non valido', 400);
        }

        error_log(print_r($body, true), 3, '/tmp/fusion_vald_debug.log');

        $saved = 0;
        $links = isset($body['links']) ? $body['links'] : $body;
        
        foreach ($links as $link) {
            if (!empty($link['athlete_id'])) {
                $this->repo->linkAthleteToVald($link['athlete_id'], $link['vald_profile_id'] ?? null);
                $saved++;
            }
        }
        
        if ($saved === 0) {
            error_log("Saved 0! Body: " . json_encode($body), 3, '/tmp/fusion_vald_debug.log');
            Response::success(['saved' => 0, 'debug_body' => $body]);
        }
        
        error_log("Saved: " . $saved . "\n", 3, '/tmp/fusion_vald_debug.log');
        Response::success(['saved' => $saved, 'message' => 'Collegati ' . $saved . ' atleti.']);
    }

    /**
     * POST /api/?module=vald&action=sync
     */
    public function sync(): void
    {
        Auth::requireWrite('athletes');
        try {
            $result = $this->service->performSync(TenantContext::id());
            Response::success([
                'message'          => 'Sincronizzazione completata: ' . $result['synced'] . ' nuovi test salvati su ' . $result['found'] . ' trovati.',
                'synced'           => $result['synced'],
                'found'            => $result['found'],
                'skipped'          => $result['skipped'],
                'unlinkedAthletes' => $result['unlinkedAthletes'] ?? [],
            ]);
        } catch (\Throwable $e) {
            Response::error('Errore sincronizzazione VALD: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/?module=vald&action=recovery
     */
    public function recovery(): void
    {
        Auth::requireRole('admin');
        try {
            $stats = $this->service->repairLinks(TenantContext::id());
            Response::success([
                'updated' => $stats['updated'],
                'already_ok' => $stats['already_ok'],
                'orphaned' => $stats['orphaned'],
                'message' => 'Riparazione completata: ' . $stats['updated'] . ' record ricollegati correttamente.',
            ]);
        } catch (\Throwable $e) {
            Response::error('Errore riparazione VALD: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/?module=vald&action=uploadCsv
     */
    public function uploadCsv(): void
    {
        Auth::requireWrite('athletes');
        
        if (!isset($_FILES['file'])) {
            Response::error('Nessun file caricato', 400);
        }
        
        $file = $_FILES['file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Errore durante il caricamento del file: ' . $file['error'], 400);
        }
        
        // Move to temp directory
        $tmpPath = $file['tmp_name'] . '.csv';
        if (!move_uploaded_file($file['tmp_name'], $tmpPath)) {
            Response::error('Errore nel salvataggio temporaneo del file', 500);
        }
        
        try {
            $analysisResult = $this->service->processCsv($tmpPath);
            unlink($tmpPath);
            
            if ($analysisResult === null) {
                Response::error('Analisi fallita. Verifica il formato del CSV.', 500);
            }
            
            // For now, return the results to display in the frontend
            // You might want to save these results to the DB as well
            Response::success([
                'message' => 'Analisi completata con successo.',
                'data' => $analysisResult,
            ]);
            
        } catch (\Throwable $e) {
            if (file_exists($tmpPath)) unlink($tmpPath);
            Response::error('Errore processamento CSV: ' . $e->getMessage(), 500);
        }
    }
}