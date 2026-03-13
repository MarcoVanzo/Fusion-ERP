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
     * POST /api/?module=vald&action=adminReset
     * Admin-only: clears all VALD test results and unlinks all athletes.
     * Call from browser console when logged in as admin.
     */
    public function adminReset(): void
    {
        Auth::requireRole('admin');
        $tenantId = TenantContext::id();
        $db = \FusionERP\Shared\Database::getInstance();

        $del = $db->prepare('DELETE FROM vald_test_results WHERE tenant_id = :tid');
        $del->execute([':tid' => $tenantId]);
        $deleted = $del->rowCount();

        $unlink = $db->prepare('UPDATE athletes SET vald_athlete_id = NULL WHERE tenant_id = :tid');
        $unlink->execute([':tid' => $tenantId]);
        $unlinked = $unlink->rowCount();

        Response::success([
            'deleted_tests' => $deleted,
            'unlinked_athletes' => $unlinked,
            'message' => "Reset completato: $deleted test eliminati, $unlinked atleti sganciati.",
        ]);
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

        // 5. Historical results (last 5) for trend context
        $history = array_slice($this->repo->getResultsByAthlete($athleteId), 0, 5);

        // 6. AI evaluations via Gemini
        $prompt = $this->buildValdPrompt($semaphore, $asymmetry, $profile, $history);
        [$aiDiagnosis, $aiPlan] = $this->callGeminiVald($prompt);

        // 7. All results for chart
        $allResults = $this->repo->getResultsByAthlete($athleteId);
        foreach ($allResults as &$res) {
            if (isset($res['metrics'])) {
                $m = json_decode($res['metrics'], true);
                $res['metrics'] = $m;
                // Pre-compute asymmetry so history table has the values
                $asym = $this->computeAsymmetry($m ?: []);
                $res['asymmetry'] = $asym;
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
                'jumpHeight' => $jumpHeight,
                'brakingImpulse' => $brakingImpulse,
                'asymmetryPct' => $asymmetryPct,
                'baselineBraking' => $baselineBraking,
                'semaphore' => $semaphore,
                'asymmetry' => $asymmetry,
                'profile' => $profile,
                'aiDiagnosis' => $aiDiagnosis,
                'aiPlan' => $aiPlan,
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
        if ($forceRelative >= 2.0 && $rsimod >= 0.45) {
            $classification = 'ESPLOSIVO';
            $recommendation = 'Mantenimento e agilità. Potenza reattiva eccellente.';
        }
        elseif ($forceRelative >= 2.0 && $rsimod < 0.45) {
            $classification = 'LENTO';
            $recommendation = 'Power training e pliometria. Buona forza, spinta troppo lunga.';
        }
        elseif ($forceRelative < 2.0 && $rsimod >= 0.45) {
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
     * Build VALD-specific Gemini prompt using expert volleyball performance framework.
     */
    private function buildValdPrompt(array $semaphore, array $asymmetry, array $profile, array $history): string
    {
        $rsiCurrent   = round($semaphore['rsimod']['current'] ?? 0, 3);
        $rsiBaseline  = round($semaphore['rsimod']['baseline'] ?? 0, 3);
        $rsiVariation = round($semaphore['rsimod']['variation'] ?? 0, 1);
        $rsiStatus    = $semaphore['status'] ?? 'UNKNOWN';
        $jumpHeight   = round($profile['jumpHeight']['value'] ?? 0, 1);
        $brakingImp   = round($profile['brakingImpulse']['value'] ?? 0, 1);
        $asymLanding  = round($asymmetry['landing']['asymmetry'] ?? 0, 1);
        $asymConcentric = round($asymmetry['concentric']['asymmetry'] ?? 0, 1);
        $weakerLimb   = $asymmetry['landing']['weaker'] ?? 'N/A';

        // Build historical trend string
        $historyLines = '';
        foreach (array_reverse($history) as $h) {
            $hm = is_array($h['metrics']) ? $h['metrics'] : json_decode($h['metrics'] ?? '{}', true);
            $hRsi = round((float)($hm['RSIModified']['Value'] ?? 0), 3);
            $hJump = round((float)($hm['JumpHeight']['Value'] ?? $hm['ConcJumpHeight']['Value'] ?? 0), 1);
            $historyLines .= "  - {$h['test_date']}: RSImod={$hRsi}, JumpHeight={$hJump}cm\n";
        }

        return <<<PROMPT
Sei un preparatore atletico specializzato nel volley giovanile. Analizza i dati CMJ ForceDecks di un'atleta.

DATI TEST ATTUALE:
- Semaforo stato forma: {$rsiStatus}
- RSImod attuale: {$rsiCurrent} (baseline: {$rsiBaseline}, variazione: {$rsiVariation}%)
- Jump Height: {$jumpHeight} cm
- Braking Impulse: {$brakingImp} N·s/kg
- Asimmetria atterraggio: {$asymLanding}% (arto più debole: {$weakerLimb})
- Asimmetria spinta concentrica: {$asymConcentric}%

STORICO ULTIMI TEST (dal meno recente al più recente):
{$historyLines}

FRAMEWORK DI ANALISI (da usare):
- RSImod stabile/in crescita + Jump Height stabile → forma TOP
- RSImod in calo ma Jump Height stabile → fatica neuromuscolare mascherata ("saltatore lento")
- Braking Impulse in calo → perdita forza eccentrica, rischio tendinopatia ("motore senza freni")
- Asimmetria > 15% improvvisa → compensazione attiva, rischio infortunio ("compensatore")
- Crollo simultaneo di tutti i parametri → overtraining ("il cotto")

Rispondi SOLO con un JSON valido (nessun testo extra, nessun markdown), con questa struttura esatta:
{
  "diagnosis": "<max 120 parole: diagnosi dello stato di forma, quale scenario (A/B/C/D), cosa indicano i numeri>",
  "plan": "<max 150 parole: piano concreto di intervento con esercizi specifici, volumi e intensità>"
}
PROMPT;
    }

    /**
     * Call Gemini API for VALD analysis. Returns [diagnosis, plan].
     * @return array{0: string, 1: string}
     */
    private function callGeminiVald(string $prompt): array
    {
        $apiKey = $_ENV['GEMINI_API_KEY'] ?? getenv('GEMINI_API_KEY') ?: ($_SERVER['GEMINI_API_KEY'] ?? '');
        if (empty($apiKey)) {
            return ['Configurare GEMINI_API_KEY nel file .env per abilitare l\'analisi AI.', ''];
        }

        $url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . $apiKey;
        $payload = json_encode([
            'contents' => [['parts' => [['text' => $prompt]]]],
            'generationConfig' => ['maxOutputTokens' => 600, 'temperature' => 0.4],
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 20,
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || !$response) {
            error_log("[VALD GEMINI] HTTP {$httpCode}");
            return ['Analisi AI temporaneamente non disponibile.', ''];
        }

        $data = json_decode($response, true);
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';

        // Strip markdown fences if present
        $text = preg_replace('/^```(?:json)?\s*/m', '', $text);
        $text = preg_replace('/```\s*$/m', '', $text);
        $parsed = json_decode(trim($text), true);

        if (!$parsed) {
            // Fallback: return raw text in diagnosis
            return [trim($text), ''];
        }

        return [
            trim($parsed['diagnosis'] ?? ''),
            trim($parsed['plan'] ?? ''),
        ];
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

        // Guard: skip if VALD credentials not configured.
        // Check env vars first, then fall back to ValdCredentials constants (same logic as ValdService).
        $guardClientId     = (getenv('VALD_CLIENT_ID')     ?: $_SERVER['VALD_CLIENT_ID']     ?? '') ?: ValdCredentials::CLIENT_ID;
        $guardClientSecret = (getenv('VALD_CLIENT_SECRET') ?: $_SERVER['VALD_CLIENT_SECRET'] ?? '') ?: ValdCredentials::CLIENT_SECRET;
        if (empty($guardClientId) || empty($guardClientSecret)) {
            error_log('[VALD Sync] Credenziali non configurate (VALD_CLIENT_ID / VALD_CLIENT_SECRET).');
            return $stats;
        }

        $tenantId = \FusionERP\Shared\TenantContext::id();
        $db       = \FusionERP\Shared\Database::getInstance();

        // Extend execution time — Aruba default is 30s which is too short for full sync
        @set_time_limit(300);

        // Pre-build athlete lookup map (vald_athlete_id → erp athlete id)
        // This avoids one SELECT per test (huge speed improvement)
        $mapStmt = $db->prepare(
            'SELECT id, vald_athlete_id FROM athletes
             WHERE tenant_id = :tid AND vald_athlete_id IS NOT NULL AND deleted_at IS NULL'
        );
        $mapStmt->execute([':tid' => $tenantId]);
        $athleteMap = []; // vald_athlete_id → erp_athlete_id
        foreach ($mapStmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $athleteMap[$row['vald_athlete_id']] = $row['id'];
        }

        // Pre-build set of already-saved test_ids to skip getTrials() for existing ones
        $existingStmt = $db->prepare(
            'SELECT test_id FROM vald_test_results WHERE tenant_id = :tid'
        );
        $existingStmt->execute([':tid' => $tenantId]);
        $existingTestIds = array_flip($existingStmt->fetchAll(\PDO::FETCH_COLUMN));

        // Process in 90-day chunks from Jan 2023 — fetch + save each chunk immediately
        $startStamp   = strtotime('2023-01-01');
        $endStamp     = time();
        $chunkSeconds = 90 * 86400;

        for ($t = $startStamp; $t < $endStamp; $t += $chunkSeconds) {
            $dateFrom = date('Y-m-d', $t);
            $dateTo   = date('Y-m-d', min($t + $chunkSeconds - 1, $endStamp));
            $page     = 1;

            while (true) {
                $pageResults = $this->service->getTestResults($dateFrom, '', $page, $dateTo);
                if (empty($pageResults) || !is_array($pageResults) || isset($pageResults['error'])) break;

                $stats['found'] += count($pageResults);

                foreach ($pageResults as $test) {
                    $valdAthleteId = $test['athleteId'] ?? $test['hubAthleteId'] ?? null;
                    if (!$valdAthleteId) { $stats['skipped']++; continue; }

                    // Use pre-built map instead of per-test DB query
                    $athleteId = $athleteMap[$valdAthleteId] ?? null;
                    if (!$athleteId) {
                        $stats['skipped']++;
                        if (!in_array($valdAthleteId, $stats['unlinkedAthletes'], true)) {
                            $stats['unlinkedAthletes'][] = $valdAthleteId;
                        }
                        continue;
                    }

                    $testIdStr = $test['id'] ?? '';

                    // Skip getTrials() for tests already saved with metrics — only re-fetch if missing
                    $metrics = [
                        'weight'   => $test['weight'] ?? null,
                        'testType' => $test['testType'] ?? null,
                    ];

                    $teamId = $test['teamId'] ?? '';

                    // If this test is already in DB with metrics, skip entirely (don't overwrite good data)
                    if (isset($existingTestIds[$testIdStr])) {
                        $stats['skipped']++;
                        continue;
                    }

                    if ($teamId && $testIdStr) {
                        try {
                            $trialsData = $this->service->getTrials($teamId, $testIdStr);

                            if (is_array($trialsData) && !empty($trialsData)) {
                                $accumulatedMetrics = [];
                                $trialCounts        = [];
                                $allDiagKeys = [];

                                foreach ($trialsData as $trial) {
                                    if (!isset($trial['results']) || !is_array($trial['results'])) continue;

                                    foreach ($trial['results'] as $res) {
                                        $def  = strtoupper($res['definition']['result'] ?? '');
                                        $val  = $res['value'] ?? null;
                                        $limb = $res['limb'] ?? 'Trial';
                                        $allDiagKeys[] = ($res['definition']['result'] ?? '') . ' [' . $limb . ']';

                                        if (!$def || $val === null) continue;

                                        $keyToStore = null;

                                        if ($limb === 'Trial') {
                                            if ($def === 'RSI_MODIFIED') {
                                                $rsi = (float)$val;
                                                if ($rsi > 3.0) $rsi /= 100.0;
                                                $val = round($rsi, 3);
                                                $keyToStore = 'RSIModified';
                                            }
                                            if (in_array($def, [
                                                'JUMP_HEIGHT_FLIGHT_TIME', 'FLIGHT_TIME_JUMP_HEIGHT',
                                                'JUMP_HEIGHT', 'ESTIMATED_JUMP_HEIGHT',
                                                'JUMP_HEIGHT_IMPULSE', 'JUMP_HEIGHT_IMP_MOM',
                                                'JUMP_HEIGHT_IMPULSE_MOMENTUM',
                                            ])) {
                                                $cm = (float)$val;
                                                if ($cm < 1.0) $cm *= 100.0;
                                                $keyToStore = 'JumpHeight';
                                                $val = $cm;
                                            }
                                            if ($def === 'PEAK_FORCE')             { $keyToStore = 'PeakForce'; }
                                            if (in_array($def, [
                                                'BRAKING_IMPULSE', 'ECCENTRIC_BRAKING_IMPULSE',
                                                'BRAKING_PHASE_IMPULSE', 'BRAKING_PHASE_NET_IMPULSE',
                                                'NET_BRAKING_IMPULSE', 'ECC_BRAKING_IMPULSE',
                                            ])) { $keyToStore = 'BrakingImpulse'; }
                                            if ($def === 'CONCENTRIC_PEAK_FORCE')  { $keyToStore = 'ConcentricPeakForce'; }
                                            if ($def === 'CONCENTRIC_PEAK_POWER')  { $keyToStore = 'ConcentricPeakPower'; }
                                            if ($def === 'CONCENTRIC_PEAK_VELOCITY') { $keyToStore = 'ConcentricPeakVelocity'; }
                                            if (in_array($def, ['PEAK_LANDING_FORCE', 'LANDING_PEAK_FORCE'])) {
                                                $keyToStore = 'PeakLandingForce';
                                            }
                                            if ($def === 'TIME_TO_TAKEOFF') {
                                                $val = ((float)$val) * 1000;
                                                $keyToStore = 'TimeToTakeoff';
                                            }
                                            if ($def === 'CONTRACTION_TIME') {
                                                $val = ((float)$val) * 1000;
                                                $keyToStore = 'ContractionTime';
                                            }
                                        }

                                        if ($limb === 'Left') {
                                            if (in_array($def, ['PEAK_FORCE', 'PEAK_FORCE_LEFT']))       { $keyToStore = 'PeakForceLeft'; }
                                            if (in_array($def, ['PEAK_LANDING_FORCE', 'LANDING_PEAK_FORCE',
                                                                  'LANDING_FORCE_LEFT', 'PEAK_LANDING_FORCE_LEFT'])) { $keyToStore = 'LandingForceLeft'; }
                                        }

                                        if ($limb === 'Right') {
                                            if (in_array($def, ['PEAK_FORCE', 'PEAK_FORCE_RIGHT']))      { $keyToStore = 'PeakForceRight'; }
                                            if (in_array($def, ['PEAK_LANDING_FORCE', 'LANDING_PEAK_FORCE',
                                                                  'LANDING_FORCE_RIGHT', 'PEAK_LANDING_FORCE_RIGHT'])) { $keyToStore = 'LandingForceRight'; }
                                        }

                                        if ($keyToStore !== null) {
                                            $accumulatedMetrics[$keyToStore] = ($accumulatedMetrics[$keyToStore] ?? 0.0) + (float)$val;
                                            $trialCounts[$keyToStore]        = ($trialCounts[$keyToStore] ?? 0) + 1;
                                        }
                                    }
                                }

                                foreach ($accumulatedMetrics as $key => $sumVal) {
                                    $n = $trialCounts[$key] ?? 1;
                                    $avgVal = $sumVal / $n;
                                    $decimals = match(true) {
                                        $key === 'TimeToTakeoff' || $key === 'ContractionTime' => 0,
                                        $key === 'ConcentricPeakVelocity'                      => 3,
                                        $key === 'RSIModified'                                 => 3,
                                        in_array($key, ['JumpHeight', 'JumpHeightImpMom', 'PeakForce',
                                                        'LandingForceLeft', 'LandingForceRight',
                                                        'PeakForceLeft', 'PeakForceRight'])    => 1,
                                        default                                                => 2,
                                    };
                                    $metrics[$key] = ['Value' => round($avgVal, $decimals)];
                                }

                                if (!empty($allDiagKeys) && $stats['synced'] < 3) {
                                    error_log('[VALD Sync DIAG] Test ' . $test['id'] . ' keys: ' . implode(', ', array_unique($allDiagKeys)));
                                }
                            }
                        } catch (\Throwable $e) {
                            error_log('[VALD Sync] Errore getTrials per test ' . $testIdStr . ': ' . $e->getMessage());
                        }
                    }

                    $this->repo->saveResult([
                        ':id'        => 'VTST_' . bin2hex(random_bytes(4)),
                        ':tenant_id' => $tenantId,
                        ':athlete_id'=> $athleteId,
                        ':test_id'   => $testIdStr,
                        ':test_date' => date('Y-m-d H:i:s', strtotime($test['recordedUTC'] ?? $test['analysedUTC'] ?? 'now')),
                        ':test_type' => $test['testType'] ?? 'CMJ',
                        ':metrics'   => json_encode($metrics),
                    ]);

                    // Add to existingTestIds so subsequent pages don't re-fetch trials for the same test
                    $existingTestIds[$testIdStr] = true;

                    if (!empty($test['weight'])) {
                        $stmtW = $db->prepare('UPDATE athletes SET weight_kg = :w WHERE id = :id AND tenant_id = :tid');
                        $stmtW->execute([':w' => round((float)$test['weight'], 1), ':id' => $athleteId, ':tid' => $tenantId]);
                    }

                    $stats['synced']++;
                } // end foreach $pageResults

                if (count($pageResults) < 50) break;
                $page++;
                if ($page > 50) break;
            } // end while pagination
        } // end for chunk loop

        error_log('[VALD Sync] Completata: ' . (string)$stats['synced'] . ' salvati, ' . (string)$stats['skipped'] . ' saltati su ' . (string)$stats['found'] . ' trovati.');
        return $stats;
    }
}