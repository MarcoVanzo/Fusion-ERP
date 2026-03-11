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
    private $repo;
    private $service;

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
        try {
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

        // Expose top-level CMJ KPIs for easy consumption by the dashboard
        $jumpHeight = $profile['jumpHeight'] ?? null;
        $brakingImpulse = $profile['brakingImpulse'] ?? null;
        $asymmetryPct = $asymmetry['landing']['asymmetry'] ?? null;

        // Baseline braking impulse (average of last 5 tests, if available)
        $baselineBraking = $this->repo->getBaselineBrakingImpulse($athleteId);

            Response::success([
                'hasData' => true,
                'testDate' => $latest['test_date'],
                'testType' => $latest['test_type'],
                // CMJ 4 KPIs (top-level for dashboard consumption)
                'jumpHeight' => $jumpHeight,
                'brakingImpulse' => $brakingImpulse,
                'asymmetryPct' => $asymmetryPct,
                'baselineBraking' => $baselineBraking,
                'semaphore' => $semaphore,
                'asymmetry' => $asymmetry,
                'profile' => $profile,
                'ranking' => $ranking,
                'coachMessage' => $coachMessage,
                'results' => $allResults,
            ]);
        } catch (\Throwable $e) {
            Response::error('Critico VALD: ' . $e->getMessage() . ' File: ' . basename($e->getFile()) . ' Line: ' . $e->getLine(), 500);
        }
    }

    /**
     * Compute semaphore status from RSImod and TimeToTakeoff.
     */
    private function computeSemaphore(array $metrics, ?array $baseline): array
    {
        $currentRSI = (float)($metrics['RSIModified']['Value'] ?? 0);
        $currentTttO = (float)($metrics['TimeToTakeoff']['Value'] ?? 0);
        $baselineRSI = $baseline['rsimod_avg'] ?? null;
        $baselineTttO = $baseline['ttto_avg'] ?? null;

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
            'baselineTests' => $baseline['count'] ?? 0,
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
        $jumpHeight = round((float)($metrics['JumpHeightTotal']['Value'] ?? $metrics['JumpHeight']['Value'] ?? 0), 1);

        // Braking Impulse: Ns — from VALD metric or computed from BrakingRFD if available
        $brakingImpulse = (float)($metrics['BrakingImpulse']['Value']
            ?? $metrics['EccentricBrakingImpulse']['Value']
            ?? $metrics['BrakingPhaseImpulse']['Value']
            ?? 0);

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
            'jumpHeight' => $jumpHeight,
            'brakingImpulse' => $brakingImpulse > 0 ? round($brakingImpulse, 1) : null,
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
            $variation = isset($semaphore['rsimod']['variation']) ? $semaphore['rsimod']['variation'] : 0;
            $msg .= sprintf(
                " Ha una perdita del %.0f%% nella potenza di salto e tempi di reazione rallentati",
                $variation
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
     * GET /api/?module=vald&action=valdAthletes
     * Returns VALD athletes alongside their currently matched ERP athlete (if any),
     * plus all ERP athletes for dropdown selection.
     */
    public function valdAthletes(): void
    {
        Auth::requireRead('athletes');

        $tenantId = \FusionERP\Shared\TenantContext::id();
        $db       = \FusionERP\Shared\Database::getInstance();

        // 1. Fetch VALD athletes from API — wrap in try/catch so auth failures
        //    (missing credentials, OAuth2 errors) return a clean 502 instead of 500
        try {
            $valdAthletes = $this->service->getAthletes();
        } catch (\Throwable $e) {
            error_log('[VALD] valdAthletes(): ' . $e->getMessage());
            $msg = strpos($e->getMessage(), 'Access Token') !== false
                ? 'Autenticazione VALD fallita. Verifica VALD_CLIENT_ID e VALD_CLIENT_SECRET nel file .env.'
                : 'Errore durante il recupero degli atleti da VALD: ' . $e->getMessage();
            Response::error($msg, 502);
            return;
        }

        if (!is_array($valdAthletes)) {
            Response::error('Impossibile recuperare atleti da VALD: risposta non valida dall\'API.', 502);
            return;
        }

        // 2. Fetch all ERP athletes for this tenant — GROUP BY a.id to deduplicate athletes
        //    who were created before the athlete_teams junction table (V050), where each
        //    team assignment created a separate row in athletes with the same full_name.
        $stmt = $db->prepare(
            'SELECT a.id, a.full_name, a.vald_athlete_id,
                    COALESCE(t.name, \'\') AS team_name
             FROM athletes a
             LEFT JOIN teams t ON t.id = a.team_id
             WHERE a.tenant_id = :tid
               AND a.deleted_at IS NULL
             GROUP BY a.id
             ORDER BY a.full_name'
        );
        $stmt->execute([':tid' => $tenantId]);
        $erpAthletes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // Build a lookup: vald_athlete_id → erp athlete (first linked row wins)
        $erpByValdId = [];
        foreach ($erpAthletes as $a) {
            if ($a['vald_athlete_id'] && !isset($erpByValdId[$a['vald_athlete_id']])) {
                $erpByValdId[$a['vald_athlete_id']] = $a;
            }
        }

        // 3. Auto-match VALD athletes to ERP athletes by name similarity
        $erpByName = [];
        foreach ($erpAthletes as $a) {
            $normalized = $this->normalizeName($a['full_name']);
            // Don't overwrite an already-linked athlete with an unlinked duplicate
            if (!isset($erpByName[$normalized]) || $a['vald_athlete_id']) {
                $erpByName[$normalized] = $a;
            }
        }

        $result = [];
        foreach ($valdAthletes as $va) {
            $valdId   = $va['id'];
            $valdName = $va['name'] ?? (($va['givenName'] ?? '') . ' ' . ($va['familyName'] ?? ''));

            // Check if already linked
            $linked = $erpByValdId[$valdId] ?? null;

            // Auto-suggest by name if not already linked
            $suggestion = null;
            if (!$linked) {
                $normalized = $this->normalizeName($valdName);
                $suggestion = $erpByName[$normalized] ?? null;

                // If no exact match, try partial: VALD "Adele Favaretto" → ERP "Favaretto Adele"
                if (!$suggestion) {
                    $parts    = explode(' ', $normalized);
                    $reversed = implode(' ', array_reverse($parts));
                    $suggestion = $erpByName[$reversed] ?? null;
                }
            }

            $result[] = [
                'vald_id'      => $valdId,
                'vald_name'    => $valdName,
                'vald_category' => $va['attributes'][0]['valueName'] ?? null,
                'linked_erp_id'   => $linked['id'] ?? null,
                'linked_erp_name' => $linked['full_name'] ?? null,
                'suggested_erp_id'   => $suggestion['id'] ?? null,
                'suggested_erp_name' => $suggestion['full_name'] ?? null,
            ];
        }

        // Build erpAthletes list for the dropdown — show team name to disambiguate same-name athletes
        $erpDropdown = array_values(array_map(function ($a) {
            $label = $a['full_name'];
            if (!empty($a['team_name'])) {
                $label .= ' — ' . $a['team_name'];
            }
            return ['id' => $a['id'], 'name' => $label];
        }, $erpAthletes));

        Response::success([
            'valdAthletes' => $result,
            'erpAthletes'  => $erpDropdown,
        ]);
    }

    /** Normalize a name for fuzzy matching (lowercase, no accents, trim extra spaces). */
    private function normalizeName(string $name): string
    {
        $name = mb_strtolower(trim($name));
        // Remove common accent characters
        $from = ['à','á','â','ã','ä','è','é','ê','ë','ì','í','î','ï','ò','ó','ô','õ','ö','ù','ú','û','ü'];
        $to   = ['a','a','a','a','a','e','e','e','e','i','i','i','i','o','o','o','o','o','u','u','u','u'];
        return str_replace($from, $to, $name);
    }

    /**
     * POST /api/?module=vald&action=linkAthlete
     * Body JSON: [{ "athlete_id": "ERP_xxx", "vald_athlete_id": "uuid" }, ...]
     * Pass vald_athlete_id = null to unlink.
     */
    public function linkAthlete(): void
    {
        Auth::requireWrite('athletes');

        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body) || empty($body)) {
            Response::error('Body non valido', 400);
            return;
        }

        $saved = 0;
        foreach ($body as $link) {
            $athleteId    = $link['athlete_id'] ?? '';
            $valdAthleteId = $link['vald_athlete_id'] ?? null; // null = unlink
            if (!$athleteId) continue;
            $this->repo->linkAthleteToVald($athleteId, $valdAthleteId);
            $saved++;
        }

        Response::success(['saved' => $saved, 'message' => 'Collegati ' . (string)$saved . ' atleti.']);
    }

    /**
     * POST /api/?module=vald&action=sync
     * Triggered by the UI "Sincronizza Dati VALD" button.
     */
    public function sync(): void
    {
        Auth::requireWrite('athletes');

        try {
            $result = $this->performSync();
            Response::success([
                'message'          => 'Sincronizzazione completata: ' . (string)$result['synced'] . ' nuovi test salvati su ' . (string)$result['found'] . ' trovati.',
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
     * Core sync logic — shared between the HTTP endpoint and the CLI cron.
     * Returns ['found' => int, 'synced' => int, 'skipped' => int]
     */
    public function performSync(): array
    {
        $stats = ['found' => 0, 'synced' => 0, 'skipped' => 0, 'unlinkedAthletes' => []];

        // Guard: skip if VALD credentials not configured
        if (empty(getenv('VALD_CLIENT_ID')) || empty(getenv('VALD_CLIENT_SECRET'))) {
            error_log('[VALD Sync] Credenziali non configurate (VALD_CLIENT_ID / VALD_CLIENT_SECRET).');
            return $stats;
        }

        $tenantId = \FusionERP\Shared\TenantContext::id();
        $db       = \FusionERP\Shared\Database::getInstance();

        // Incremental sync: only fetch tests newer than our latest saved one
        $lastDate = $this->repo->getLatestTestDate();
        if ($lastDate) {
            $lastDate = gmdate('Y-m-d\TH:i:s\Z', strtotime($lastDate));
        }
        $results  = $this->service->getTestResults($lastDate ?? '');

        // v2019q3 returns a flat array of test objects
        if (empty($results) || !is_array($results) || isset($results['error'])) {
            error_log('[VALD Sync] Risultato non valido o vuoto: ' . json_encode($results));
            return $stats;
        }

        $stats['found'] = count($results);

        foreach ($results as $test) {
            // v2019q3 field: athleteId (= hubAthleteId = VALD's UUID for the athlete)
            $valdAthleteId = $test['athleteId'] ?? $test['hubAthleteId'] ?? null;
            if (!$valdAthleteId) {
                $stats['skipped']++;
                continue;
            }

            // Look up athlete in our DB by their VALD athlete ID
            $stmt = $db->prepare(
                'SELECT id FROM athletes WHERE vald_athlete_id = :vid AND tenant_id = :tid LIMIT 1'
            );
            $stmt->execute([':vid' => $valdAthleteId, ':tid' => $tenantId]);
            $athleteId = $stmt->fetchColumn();

            if (!$athleteId) {
                // Athlete not linked yet — record and skip
                error_log("[VALD Sync] Atleta VALD $valdAthleteId non trovato nel tenant $tenantId.");
                $stats['skipped']++;
                // Collect unlinked VALD IDs for actionable UI feedback
                if (!in_array($valdAthleteId, $stats['unlinkedAthletes'], true)) {
                    $stats['unlinkedAthletes'][] = $valdAthleteId;
                }
                continue;
            }

            // Build metrics base from test body
            $metrics = [
                'weight' => $test['weight'] ?? null,
                'testType' => $test['testType'] ?? null,
            ];

            // In VALD v2019q3, detailed metrics are stored in the trials array.
            // We need to fetch them if the "Trials" link is provided.
            if (!empty($test['links']['Trials'])) {
                try {
                    // Exploit Reflection to use the private request() method on ValdService just for this sync
                    $serviceClass = new \ReflectionClass($this->service);
                    $reqMethod = $serviceClass->getMethod('request');
                    $reqMethod->setAccessible(true);
                    
                    $trialsData = $reqMethod->invoke($this->service, 'GET', $test['links']['Trials']);
                    
                    // Parse trials and extract the most relevant aggregate results (usually repeat: 0 or Trial limb)
                    if (is_array($trialsData)) {
                        foreach ($trialsData as $trial) {
                            if (!isset($trial['results']) || !is_array($trial['results'])) continue;
                            
                            foreach ($trial['results'] as $res) {
                                $def = $res['definition']['result'] ?? '';
                                $val = $res['value'] ?? null;
                                
                                if ($def && $val !== null) {
                                    // Map some key ForceDecks metrics to our JSON structure
                                    if (in_array($def, [
                                        'RSI_MODIFIED', 
                                        'JUMP_HEIGHT_FLIGHT_TIME', 
                                        'JUMP_HEIGHT_IMPULSE',
                                        'JUMP_HEIGHT',
                                        'ESTIMATED_JUMP_HEIGHT',
                                        'FLIGHT_TIME_JUMP_HEIGHT',
                                        'PEAK_FORCE',
                                        'BRAKING_IMPULSE',
                                        'CONCENTRIC_PEAK_FORCE',
                                        'CONCENTRIC_PEAK_POWER',
                                        'CONCENTRIC_PEAK_VELOCITY',
                                        'PEAK_LANDING_FORCE',
                                        'GROUND_CONTACT_TIME'
                                    ])) {
                                        // Standardize names
                                        $key = str_replace('_', '', ucwords(strtolower($def), '_'));
                                        if ($def === 'RSI_MODIFIED') $key = 'RSIModified';
                                        
                                        // Group all jump height variations into one or two standard fields
                                        if (in_array($def, ['JUMP_HEIGHT_FLIGHT_TIME', 'FLIGHT_TIME_JUMP_HEIGHT', 'JUMP_HEIGHT', 'ESTIMATED_JUMP_HEIGHT'])) {
                                            $key = 'JumpHeight';
                                        }
                                        if ($def === 'JUMP_HEIGHT_IMPULSE') {
                                            $key = 'JumpHeightTotal';
                                        }
                                        
                                        $metrics[$key] = ['Value' => $val];
                                    }
                                }
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    error_log("[VALD Sync] Errore recupero trials per test " . $test['id'] . ": " . $e->getMessage());
                }
            }

            $this->repo->saveResult([
                ':id'         => 'VTST_' . bin2hex(random_bytes(4)),
                ':tenant_id'  => $tenantId,
                ':athlete_id' => $athleteId,
                ':test_id'    => $test['id'],
                ':test_date'  => date('Y-m-d H:i:s', strtotime($test['recordedUTC'] ?? $test['analysedUTC'] ?? 'now')),
                ':test_type'  => $test['testType'] ?? 'CMJ',
                ':metrics'    => json_encode($metrics),
            ]);
            
            // Auto-update ERP athlete weight using the highly accurate ForceDecks measurement
            if (!empty($test['weight'])) {
                $stmtW = $db->prepare('UPDATE athletes SET weight_kg = :w WHERE id = :id AND tenant_id = :tid');
                $stmtW->execute([
                    ':w' => round((float)$test['weight'], 1),
                    ':id' => $athleteId,
                    ':tid' => $tenantId
                ]);
            }
            
            $stats['synced']++;
        }

        error_log('[VALD Sync] Completata: ' . (string)$stats['synced'] . ' salvati, ' . (string)$stats['skipped'] . ' saltati su ' . (string)$stats['found'] . ' trovati.');
        return $stats;
    }
}