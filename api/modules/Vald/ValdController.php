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
        $this->service = new ValdService();
    }

    /**
     * GET /api/?module=vald&action=results&athleteId=ATH_xxx
     */
    public function results(): void
    {
        Auth::requireRead('athletes');
        $athleteId = filter_input(INPUT_GET, 'athleteId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';

        if (empty($athleteId)) {
            Response::error('athleteId obbligatorio', 400);
        }

        $results = $this->repo->getResultsByAthlete($athleteId);

        // Decode JSON metrics for each result
        foreach ($results as &$res) {
            if (isset($res['metrics'])) {
                $res['metrics'] = json_decode($res['metrics'], true);
            }
        }

        Response::success($results);
    }

    /**
     * GET /api/?module=vald&action=analytics&athleteId=ATH_xxx
     * Returns computed analytics for the VALD Perf dashboard.
     */
    public function analytics(): void
    {
        Auth::requireRead('athletes');
        $athleteId = filter_input(INPUT_GET, 'athleteId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';

        if (empty($athleteId)) {
            Response::error('athleteId obbligatorio', 400);
        }

        // 1. Get latest test result
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
            return;
        }

        $metrics = json_decode($latest['metrics'] ?? '{}', true) ?: [];

        // 2. Baseline comparison (Semaphore)
        $baseline = $this->repo->getBaselineMetrics($athleteId);
        $semaphore = $this->computeSemaphore($metrics, $baseline);

        // 3. Asymmetry analysis
        $asymmetry = $this->computeAsymmetry($metrics);

        // 4. Force-Velocity profile
        // Get athlete weight for relative force
        $athleteWeight = $this->getAthleteWeight($athleteId);
        $profile = $this->computeProfile($metrics, $athleteWeight);

        // 5. Team ranking
        $ranking = $this->repo->getTeamRanking(5);

        // 6. Coach message
        $coachMessage = $this->generateCoachMessage($semaphore, $asymmetry, $profile);

        // 7. All results for chart
        $allResults = $this->repo->getResultsByAthlete($athleteId);
        foreach ($allResults as &$res) {
            if (isset($res['metrics'])) {
                $res['metrics'] = json_decode($res['metrics'], true);
            }
        }

        Response::success([
            'hasData' => true,
            'testDate' => $latest['test_date'],
            'testType' => $latest['test_type'],
            'semaphore' => $semaphore,
            'asymmetry' => $asymmetry,
            'profile' => $profile,
            'ranking' => $ranking,
            'coachMessage' => $coachMessage,
            'results' => $allResults,
        ]);
    }

    /**
     * Compute semaphore status from RSImod and TimeToTakeoff.
     */
    private function computeSemaphore(array $metrics, array $baseline): array
    {
        $currentRSI = (float)($metrics['RSIModified']['Value'] ?? 0);
        $currentTttO = (float)($metrics['TimeToTakeoff']['Value'] ?? 0);
        $baselineRSI = $baseline['rsimod_avg'];
        $baselineTttO = $baseline['ttto_avg'];

        // Calculate variation percentages
        $rsiVariation = null;
        $tttoVariation = null;

        if ($baselineRSI && $baselineRSI > 0) {
            $rsiVariation = abs(($currentRSI - $baselineRSI) / $baselineRSI) * 100;
        }
        if ($baselineTttO && $baselineTttO > 0) {
            $tttoVariation = abs(($currentTttO - $baselineTttO) / $baselineTttO) * 100;
        }

        // Use worst-case variation for status
        $maxVariation = max($rsiVariation ?? 0, $tttoVariation ?? 0);

        if ($maxVariation > 12) {
            $status = 'RED';
            $label = 'Rischio Elevato';
            $insight = sprintf(
                'RSImod in calo del %.0f%% vs baseline. Fatica neuromuscolare critica rilevata.',
                $rsiVariation ?? 0
            );
            $action = 'Sessione di recupero o scarico totale. Evitare carichi elevati.';
        }
        elseif ($maxVariation > 5) {
            $status = 'YELLOW';
            $label = 'Fatica Rilevata';
            $insight = sprintf(
                'RSImod in calo del %.0f%% vs baseline. Fatica neuromuscolare rilevata.',
                $rsiVariation ?? 0
            );
            $action = 'Ridurre volume scatti e balzi. Focus tecnica.';
        }
        else {
            $status = 'GREEN';
            $label = 'Ready';
            $insight = 'Parametri neuromuscolari nella norma rispetto alla baseline.';
            $action = 'Atleta pronto per carico completo.';
        }

        return [
            'status' => $status,
            'label' => $label,
            'insight' => $insight,
            'action' => $action,
            'rsimod' => [
                'current' => round($currentRSI, 3),
                'baseline' => $baselineRSI ? round($baselineRSI, 3) : null,
                'variation' => $rsiVariation !== null ? round($rsiVariation, 1) : null,
            ],
            'ttto' => [
                'current' => round($currentTttO, 0),
                'baseline' => $baselineTttO ? round($baselineTttO, 0) : null,
                'variation' => $tttoVariation !== null ? round($tttoVariation, 1) : null,
            ],
            'baselineTests' => $baseline['count'],
        ];
    }

    /**
     * Compute asymmetry analysis from left/right metrics.
     */
    private function computeAsymmetry(array $metrics): array
    {
        // ForceDecks provides Left/Right breakdown in various keys
        $landingForceL = (float)($metrics['PeakLandingForceLeft']['Value'] ?? $metrics['LandingForceLeft']['Value'] ?? 0);
        $landingForceR = (float)($metrics['PeakLandingForceRight']['Value'] ?? $metrics['LandingForceRight']['Value'] ?? 0);
        $peakForceL = (float)($metrics['PeakForceLeft']['Value'] ?? 0);
        $peakForceR = (float)($metrics['PeakForceRight']['Value'] ?? 0);

        $landingAsym = 0;
        $landingDominant = 'N/A';
        $landingWeaker = 'N/A';
        if ($landingForceL + $landingForceR > 0) {
            $landingAsym = abs($landingForceL - $landingForceR) / max($landingForceL, $landingForceR) * 100;
            $landingDominant = $landingForceL > $landingForceR ? 'SX' : 'DX';
            $landingWeaker = $landingForceL > $landingForceR ? 'DX' : 'SX';
        }

        $peakAsym = 0;
        $peakDominant = 'N/A';
        $peakWeaker = 'N/A';
        if ($peakForceL + $peakForceR > 0) {
            $peakAsym = abs($peakForceL - $peakForceR) / max($peakForceL, $peakForceR) * 100;
            $peakDominant = $peakForceL > $peakForceR ? 'SX' : 'DX';
            $peakWeaker = $peakForceL > $peakForceR ? 'DX' : 'SX';
        }

        $criticalRisk = $landingAsym > 15;

        $peakForceTotal = (float)($metrics['PeakForce']['Value'] ?? 0);
        $landingForceTotal = max($landingForceL + $landingForceR, (float)($metrics['PeakLandingForce']['Value'] ?? 0));
        $peakPct = $peakForceTotal > 0 ? round($peakForceR / $peakForceTotal * 100) : 50;
        $landingPct = $landingForceTotal > 0 ? round($landingForceR / $landingForceTotal * 100) : 50;

        return [
            'landing' => [
                'asymmetry' => round($landingAsym, 1),
                'dominant' => $landingDominant,
                'weaker' => $landingWeaker,
                'left' => round($landingForceL, 1),
                'right' => round($landingForceR, 1),
            ],
            'peak' => [
                'asymmetry' => round($peakAsym, 1),
                'dominant' => $peakDominant,
                'weaker' => $peakWeaker,
                'left' => round($peakForceL, 1),
                'right' => round($peakForceR, 1),
            ],
            'peakForcePct' => $peakPct,
            'landingPct' => $landingPct,
            'criticalRisk' => $criticalRisk,
            'riskMessage' => $criticalRisk
            ? "⚠️ Rischio Infortunio Imminente — Asimmetria in atterraggio del " . round($landingAsym) . "% ({$landingWeaker} meno carico)"
            : null,
        ];
    }

    /**
     * Compute force-velocity profile classification.
     */
    private function computeProfile(array $metrics, float $weightKg): array
    {
        $peakForce = (float)($metrics['PeakForce']['Value'] ?? 0);
        $rsimod = (float)($metrics['RSIModified']['Value'] ?? 0);
        $bodyWeightN = $weightKg * 9.81;

        $forceRelative = $bodyWeightN > 0 ? $peakForce / $bodyWeightN : 0;

        // Classification thresholds (typical for volleyball/team sports)
        if ($forceRelative >= 2.0 && $rsimod >= 1.5) {
            $classification = 'ESPLOSIVO';
            $recommendation = 'Mantenimento e agilità. Potenza reattiva eccellente.';
        }
        elseif ($forceRelative >= 2.0 && $rsimod < 1.5) {
            $classification = 'LENTO';
            $recommendation = 'Power training e pliometria. Buona forza, spinta troppo lunga.';
        }
        elseif ($forceRelative < 2.0 && $rsimod >= 1.5) {
            $classification = 'REATTIVO';
            $recommendation = 'Forza massimale. Buona velocità, deficit di forza.';
        }
        else {
            $classification = 'DEBOLE';
            $recommendation = 'Forza massimale/squat. Deficit generale di forza e velocità.';
        }

        return [
            'peakForceBW' => round($forceRelative, 2),
            'rsimod' => round($rsimod, 2),
            'classification' => $classification,
            'recommendation' => $recommendation,
            'jumpHeight' => round((float)($metrics['JumpHeightTotal']['Value'] ?? $metrics['JumpHeight']['Value'] ?? 0), 1),
        ];
    }

    /**
     * Generate coach-ready message.
     */
    private function generateCoachMessage(array $semaphore, array $asymmetry, array $profile): string
    {
        $statusLabels = ['GREEN' => 'Verde', 'YELLOW' => 'Giallo', 'RED' => 'Rosso'];
        $statusLabel = $statusLabels[$semaphore['status']] ?? $semaphore['status'];

        $msg = "L'atleta è in \"{$statusLabel}\" oggi.";

        if ($semaphore['status'] === 'RED') {
            $msg .= " Ha una perdita significativa nella potenza di salto e tempi di reazione rallentati.";
            $msg .= " Suggerisco sessione di scarico o recupero completo.";
        }
        elseif ($semaphore['status'] === 'YELLOW') {
            $msg .= sprintf(
                " Ha una perdita del %.0f%% nella potenza di salto e tempi di reazione rallentati",
                $semaphore['rsimod']['variation'] ?? 0
            );
            if ($asymmetry['criticalRisk']) {
                $msg .= sprintf(
                    ", oltre a un'asimmetria critica del %.0f%% in atterraggio su %s",
                    $asymmetry['landing']['asymmetry'],
                    $asymmetry['landing']['weaker']
                );
            }
            $msg .= ". Suggerisco di evitare sprint ad alta intensità e inserire esercizi correttivi specifici per evitare infortuni ai flessori.";
        }
        else {
            $msg .= " Parametri nella norma, pronto per carico completo.";
            if ($asymmetry['landing']['asymmetry'] > 10) {
                $msg .= sprintf(
                    " Monitorare asimmetria del %.0f%% in atterraggio.",
                    $asymmetry['landing']['asymmetry']
                );
            }
        }

        return $msg;
    }

    /**
     * Get athlete weight from the athletes table.
     */
    private function getAthleteWeight(string $athleteId): float
    {
        $db = \FusionERP\Shared\Database::getInstance();
        $stmt = $db->prepare('SELECT weight_kg FROM athletes WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $athleteId]);
        $w = $stmt->fetchColumn();
        return $w ? (float)$w : 75.0; // Default 75kg if not set
    }

    /**
     * GET /api/?module=vald&action=teamRanking
     */
    public function teamRanking(): void
    {
        Auth::requireRead('athletes');
        $ranking = $this->repo->getTeamRanking(10);
        Response::success($ranking);
    }

    /**
     * POST /api/?module=vald&action=sync
     */
    public function sync(): void
    {
        Auth::requireWrite('athletes');

        $syncedCount = $this->performSync();

        Response::success(['message' => "Sincronizzazione completata: " . (string)$syncedCount . " nuovi test trovati."]);
    }

    private function performSync(): int
    {
        // Guard: skip if VALD credentials not configured
        if (empty(getenv('VALD_CLIENT_ID')) || empty(getenv('VALD_CLIENT_SECRET'))) {
            error_log('[VALD Sync] Credenziali non configurate (VALD_CLIENT_ID / VALD_CLIENT_SECRET).');
            return 0;
        }

        try {
            // Fetch only tests modified since last sync date (incremental sync)
            $lastDate = $this->repo->getLatestTestDate();
            $results = $this->service->getTestResults($lastDate ?? '');

            if (empty($results) || !is_array($results)) {
                return 0;
            }

            $tenantId = \FusionERP\Shared\TenantContext::id();
            $db = \FusionERP\Shared\Database::getInstance();
            $synced = 0;

            foreach ($results as $test) {
                // Map VALD profileId → internal athlete_id
                $profileId = $test['profileId'] ?? null;
                if (!$profileId)
                    continue;

                $stmt = $db->prepare(
                    'SELECT id FROM athletes WHERE vald_profile_id = :pid AND tenant_id = :tid LIMIT 1'
                );
                $stmt->execute([':pid' => $profileId, ':tid' => $tenantId]);
                $athleteId = $stmt->fetchColumn();
                if (!$athleteId)
                    continue;

                $testId = $test['id'] ?? ('vald_' . bin2hex(random_bytes(4)));

                $this->repo->saveResult([
                    ':id' => 'VTST_' . bin2hex(random_bytes(4)),
                    ':tenant_id' => $tenantId,
                    ':athlete_id' => $athleteId,
                    ':test_id' => $testId,
                    ':test_date' => $test['testDateUtc'] ?? date('Y-m-d H:i:s'),
                    ':test_type' => $test['testType'] ?? 'CMJ',
                    ':metrics' => json_encode($test['metrics'] ?? []),
                ]);
                $synced++;
            }

            return $synced;

        }
        catch (\Throwable $e) {
            error_log('[VALD Sync] Errore: ' . $e->getMessage());
            return 0;
        }
    }
}