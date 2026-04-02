<?php
/**
 * ValdService — API Client for VALD Hub, Data Processing & AI
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Vald;

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\AIService;

class ValdService
{
    private string $clientId;
    private string $clientSecret;
    private string $orgId;
    private string $identityUrl;
    private string $apiBaseUrl;
    private ?string $accessToken = null;
    private ?ValdRepository $repo = null;

    public function __construct(?ValdRepository $repo = null)
    {
        $this->clientId     = (getenv('VALD_CLIENT_ID')     ?: $_SERVER['VALD_CLIENT_ID']     ?? '') ?: ValdCredentials::CLIENT_ID;
        $this->clientSecret = (getenv('VALD_CLIENT_SECRET') ?: $_SERVER['VALD_CLIENT_SECRET'] ?? '') ?: ValdCredentials::CLIENT_SECRET;
        $this->orgId        = (getenv('VALD_ORG_ID')        ?: $_SERVER['VALD_ORG_ID']        ?? '') ?: ValdCredentials::ORG_ID;
        $this->identityUrl  = (getenv('VALD_IDENTITY_URL')  ?: $_SERVER['VALD_IDENTITY_URL']  ?? '') ?: ValdCredentials::IDENTITY_URL;
        $this->apiBaseUrl   = (getenv('VALD_API_BASE_URL')  ?: $_SERVER['VALD_API_BASE_URL']  ?? '') ?: ValdCredentials::API_BASE_URL;
        $this->repo         = $repo;
    }

    /** ─── VALD HUB API CORE ────────────────────────────────────────────── */

    private function getAccessToken(): string
    {
        if ($this->accessToken) {
            return $this->accessToken;
        }

        $ch = curl_init($this->identityUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'audience' => 'vald-api-external'
        ]));

        $response = curl_exec($ch);
        $data = json_decode($response ?: '', true);
        curl_close($ch);

        if (!isset($data['access_token'])) {
            throw new \Exception('Failed to obtain VALD Access Token: ' . ($data['error_description'] ?? $data['error'] ?? $response));
        }

        $this->accessToken = $data['access_token'];
        return $this->accessToken;
    }

    private function request(string $method, string $endpoint, ?array $data = null): ?array
    {
        $token = $this->getAccessToken();
        $url = $this->apiBaseUrl . $endpoint;

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        $headers = [
            "Authorization: Bearer $token",
            "Content-Type: application/json",
            "Accept: application/json"
        ];

        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode >= 400) {
            error_log("[VALD API] Error $httpCode on $url: $response");
            return null;
        }

        return json_decode($response ?: '', true);
    }

    public function getTeams(): ?array
    {
        return $this->request('GET', '/v2019q3/teams');
    }

    public function getAthletes(string $teamId = '', string $modifiedFrom = ''): ?array
    {
        if (!$teamId) $teamId = $this->orgId;
        $endpoint = "/v2019q3/teams/$teamId/athletes";
        if ($modifiedFrom) $endpoint .= '?modifiedFrom=' . urlencode($modifiedFrom);
        return $this->request('GET', $endpoint);
    }

    public function getTestResults(string $modifiedSince = '', string $teamId = '', int $page = 1, string $dateToStr = ''): ?array
    {
        if (!$teamId) $teamId = $this->orgId;
        $dateTo = $dateToStr ?: date('Y-m-d');
        $dateFrom = $modifiedSince ? substr($modifiedSince, 0, 10) : date('Y-m-d', strtotime('-90 days'));
        $endpoint = '/v2019q3/teams/' . $teamId . '/tests/' . $dateFrom . '/' . $dateTo . '/' . (string)$page;
        $res = $this->request('GET', $endpoint);
        return is_array($res) ? ($res['items'] ?? $res) : null;
    }

    public function getTrials(string $teamId, string $testId): ?array
    {
        if (!$teamId) $teamId = $this->orgId;
        $endpoint = "/v2019q3/teams/$teamId/tests/$testId/trials";
        return $this->request('GET', $endpoint);
    }

    /** ─── ANALISI MATEMATICA E FISICA ──────────────────────────────────── */

    public function computeSemaphore(array $metrics, ?array $baseline): array
    {
        $currentRSI = (float)($metrics['RSIModified']['Value'] ?? 0);
        $currentTttO = (float)($metrics['TimeToTakeoff']['Value'] ?? 0);
        $baselineRSI = $baseline['rsimod_avg'] ?? null;
        $baselineTttO = $baseline['ttto_avg'] ?? null;

        $rsiVariation = null;
        $tttoVariation = null;

        if ($baselineRSI && $baselineRSI > 0) {
            $rsiVariation = abs(($currentRSI - $baselineRSI) / $baselineRSI) * 100;
        }
        if ($baselineTttO && $baselineTttO > 0) {
            $tttoVariation = abs(($currentTttO - $baselineTttO) / $baselineTttO) * 100;
        }

        $maxVariation = max($rsiVariation ?? 0, $tttoVariation ?? 0);

        if ($maxVariation > 12) {
            $status = 'RED';
            $label = 'Rischio Elevato';
            $insight = sprintf('RSImod in calo del %.0f%% vs baseline. Fatica neuromuscolare critica rilevata.', $rsiVariation ?? 0);
            $action = 'Sessione di recupero o scarico totale. Evitare carichi elevati.';
        } elseif ($maxVariation > 5) {
            $status = 'YELLOW';
            $label = 'Fatica Rilevata';
            $insight = sprintf('RSImod in calo del %.0f%% vs baseline. Fatica neuromuscolare rilevata.', $rsiVariation ?? 0);
            $action = 'Ridurre volume scatti e balzi. Focus tecnica.';
        } else {
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

    public function computeAsymmetry(array $metrics): array
    {
        $landingForceL = (float)($metrics['PeakLandingForceLeft']['Value'] ?? $metrics['LandingForceLeft']['Value'] ?? 0);
        $landingForceR = (float)($metrics['PeakLandingForceRight']['Value'] ?? $metrics['LandingForceRight']['Value'] ?? 0);
        $peakForceL = (float)($metrics['PeakForceLeft']['Value'] ?? 0);
        $peakForceR = (float)($metrics['PeakForceRight']['Value'] ?? 0);

        $landingAsym = 0; $landingDominant = 'N/A'; $landingWeaker = 'N/A';
        if ($landingForceL + $landingForceR > 0) {
            $landingAsym = abs($landingForceL - $landingForceR) / max($landingForceL, $landingForceR) * 100;
            $landingDominant = $landingForceL > $landingForceR ? 'SX' : 'DX';
            $landingWeaker = $landingForceL > $landingForceR ? 'DX' : 'SX';
        }

        $peakAsym = 0; $peakDominant = 'N/A'; $peakWeaker = 'N/A';
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

    public function computeProfile(array $metrics, float $weightKg): array
    {
        $peakForce = (float)($metrics['PeakForce']['Value'] ?? 0);
        $rsimod = (float)($metrics['RSIModified']['Value'] ?? 0);
        $bodyWeightN = $weightKg * 9.81;
        $jumpHeight = round((float)($metrics['JumpHeightTotal']['Value'] ?? $metrics['JumpHeight']['Value'] ?? 0), 1);
        $brakingImpulse = (float)($metrics['BrakingImpulse']['Value'] ?? $metrics['EccentricBrakingImpulse']['Value'] ?? $metrics['BrakingPhaseImpulse']['Value'] ?? 0);
        $forceRelative = $bodyWeightN > 0 ? $peakForce / $bodyWeightN : 0;

        if ($forceRelative >= 2.0 && $rsimod >= 0.45) {
            $classification = 'ESPLOSIVO'; $recommendation = 'Mantenimento e agilità. Potenza reattiva eccellente.';
        } elseif ($forceRelative >= 2.0 && $rsimod < 0.45) {
            $classification = 'LENTO'; $recommendation = 'Power training e pliometria. Buona forza, spinta troppo lunga.';
        } elseif ($forceRelative < 2.0 && $rsimod >= 0.45) {
            $classification = 'REATTIVO'; $recommendation = 'Forza massimale. Buona velocità, deficit di forza.';
        } else {
            $classification = 'DEBOLE'; $recommendation = 'Forza massimale/squat. Deficit generale di forza e velocità.';
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

    public function computeMuscleMap(?array $semaphore, ?array $asymmetry): array
    {
        $semaphore = $semaphore ?: [];
        $asymmetry = $asymmetry ?: [];

        $map = [
            'core'    => null,
            'quads_l' => null,
            'quads_r' => null,
            'hips_l'  => null,
            'hips_r'  => null,
            'glutes_l' => null,
            'glutes_r' => null,
            'hamstrings_l' => null,
            'hamstrings_r' => null,
            'calves_l' => null,
            'calves_r' => null,
        ];

        // Core highlighting (based on fatigue semaphore)
        $status = $semaphore['status'] ?? 'GREEN';
        if ($status === 'RED') $map['core'] = '#FF1744';
        elseif ($status === 'YELLOW') $map['core'] = '#FFD600';

        // Asymmetry highlighting (Proxy for all lower body segments)
        $asymVal = (float)($asymmetry['landing']['asymmetry'] ?? 0);
        $weaker  = $asymmetry['landing']['weaker'] ?? 'N/A';

        $color = null;
        if ($asymVal > 15) $color = '#FF1744';
        elseif ($asymVal > 10) $color = '#FFD600';

        if ($color) {
            if ($weaker === 'SX') {
                $map['quads_l'] = $color;
                $map['hips_l']  = $color;
                $map['glutes_l'] = $color;
                $map['hamstrings_l'] = $color;
                $map['calves_l'] = $color;
            } elseif ($weaker === 'DX') {
                $map['quads_r'] = $color;
                $map['hips_r']  = $color;
                $map['glutes_r'] = $color;
                $map['hamstrings_r'] = $color;
                $map['calves_r'] = $color;
            }
        }

        return $map;
    }

    public function getAthleteWeight(string $athleteId): float
    {
        $db = \FusionERP\Shared\Database::getInstance();
        $stmt = $db->prepare('SELECT weight_kg FROM athletes WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $athleteId]);
        $w = $stmt->fetchColumn();
        return $w ? (float)$w : 75.0;
    }

    /** ─── AI INTEGRATION ────────────────────────────────────────────────── */

    public function buildValdPrompt(array $semaphore, array $asymmetry, array $profile, array $history, string $part = 'diagnosis'): string
    {
        $rsiCurrent   = round((float)($semaphore['rsimod']['current'] ?? 0), 3);
        $rsiBaseline  = round((float)($semaphore['rsimod']['baseline'] ?? 0), 3);
        $rsiVariation = round((float)($semaphore['rsimod']['variation'] ?? 0), 1);
        $rsiStatus    = $semaphore['status'] ?? 'UNKNOWN';
        $jumpHeight   = round((float)($profile['jumpHeight'] ?? 0), 1);
        $brakingImp   = round((float)($profile['brakingImpulse'] ?? 0), 1);
        $asymLanding  = round($asymmetry['landing']['asymmetry'] ?? 0, 1);
        $asymPeak     = round($asymmetry['peak']['asymmetry'] ?? 0, 1);
        $weakerLimb   = $asymmetry['landing']['weaker'] ?? 'N/A';

        $historyLines = '';
        foreach (array_reverse($history) as $h) {
            $metricsData = is_array($h['metrics'] ?? null) ? $h['metrics'] : json_decode((string)($h['metrics'] ?? '{}'), true);
            $hm = is_array($metricsData) ? $metricsData : [];
            $hRsi  = round((float)($hm['RSIModified']['Value'] ?? 0), 3);
            $hJump = round((float)($hm['JumpHeight']['Value'] ?? $hm['ConcJumpHeight']['Value'] ?? 0), 1);
            $historyLines .= '  - ' . $h['test_date'] . ': RSImod=' . $hRsi . ', JumpHeight=' . $hJump . "cm\n";
        }

        $context = <<<CTX
Sei il miglior preparatore atletico al mondo specializzato in pallavolo giovanile di club.
Hai 25 anni di esperienza con squadre giovanili U13-U20, conosci ForceDecks/VALD, prevenzione infortuni e programmazione del carico in-season.
CONTESTO SQUADRA: giovani pallavoliste di club che si allenano 6 giorni su 7 per circa 3 ore al giorno (tecnico-tattico + preparazione atletica integrata).

DATI TEST ATTUALE:
- Status semaforo: {$rsiStatus}
- RSImod: {$rsiCurrent} (baseline: {$rsiBaseline}, variazione: {$rsiVariation}%)
- Jump Height: {$jumpHeight} cm
- Braking Impulse: {$brakingImp} N\u00b7s/kg
- Asimmetria atterraggio: {$asymLanding}% (arto pi\u00f9 debole: {$weakerLimb})
- Asimmetria spinta: {$asymPeak}%

STORICO ULTIMI TEST:
{$historyLines}
CTX;

        if ($part === 'plan') {
            return $context . "\n" . <<<PROMPT
VAI DIRETTO: non spiegare i dati, non ripetere i numeri.
Forma la tua conclusione sul quadro fisico dell'atleta e poi fornisci il PIANO DI INTERVENTO con esercizi concreti, serie, ripetizioni e carichi.
Usa elenchi puntati o numerati per gli esercizi (esercizio, serie x ripetizioni, carico/intensita'). Non usare tabelle markdown. No JSON, no asterischi, no grassetto.
PROMPT;
        }

        return $context . "\n" . <<<PROMPT
VAI DIRETTO: non spiegare i dati, non ripetere i numeri.
Di' solo qual e' la condizione dell'atleta (2-3 righe) e cosa deve FARE il coach a breve termine (elenco concreto di azioni).
L'obiettivo e' permettere all'atleta di allenarsi: fermarsi deve essere l'ultima possibilita'. No JSON, no asterischi, no grassetto.
PROMPT;
    }

    public function callGeminiSingle(string $prompt): string
    {
        try {
            return trim(AIService::generateContent($prompt, ['temperature' => 0.4, 'maxOutputTokens' => 4096]));
        } catch (\Exception $e) {
            error_log("[VALD GEMINI SINGLE] Error: " . $e->getMessage());
            return 'Analisi AI temporaneamente non disponibile. Errore: ' . $e->getMessage();
        }
    }

    /** ─── SYNC ──────────────────────────────────────────────────────────── */

    public function performSync(string $tenantId): array
    {
        // Require repo
        if (!$this->repo) {
            throw new \Exception("ValdRepository required for performSync");
        }
        
        $stats = ['found' => 0, 'synced' => 0, 'skipped' => 0, 'unlinkedAthletes' => []];
        $db = \FusionERP\Shared\Database::getInstance();
        @set_time_limit(300);

        $mapStmt = $db->prepare('SELECT id, vald_athlete_id FROM athletes WHERE tenant_id = :tid AND vald_athlete_id IS NOT NULL AND deleted_at IS NULL');
        $mapStmt->execute([':tid' => $tenantId]);
        $athleteMap = [];
        foreach ($mapStmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $athleteMap[$row['vald_athlete_id']] = $row['id'];
        }

        $existingStmt = $db->prepare('SELECT test_id FROM vald_test_results WHERE tenant_id = :tid');
        $existingStmt->execute([':tid' => $tenantId]);
        $existingTestIds = array_flip($existingStmt->fetchAll(\PDO::FETCH_COLUMN));

        $startStamp   = strtotime('2023-01-01');
        $endStamp     = time();
        $chunkSeconds = 90 * 86400;

        for ($t = $startStamp; $t < $endStamp; $t += $chunkSeconds) {
            $dateFrom = date('Y-m-d', $t);
            $dateTo   = date('Y-m-d', min($t + $chunkSeconds - 1, $endStamp));
            $page     = 1;

            while (true) {
                $pageResults = $this->getTestResults($dateFrom, '', $page, $dateTo);
                if (empty($pageResults) || isset($pageResults['error'])) break;

                $stats['found'] += count($pageResults);

                foreach ($pageResults as $test) {
                    $valdAthleteId = $test['athleteId'] ?? $test['hubAthleteId'] ?? null;
                    if (!$valdAthleteId) { $stats['skipped']++; continue; }

                    $athleteId = $athleteMap[$valdAthleteId] ?? null;
                    if (!$athleteId) {
                        $stats['skipped']++;
                        if (!in_array($valdAthleteId, $stats['unlinkedAthletes'], true)) {
                            $stats['unlinkedAthletes'][] = $valdAthleteId;
                        }
                        continue;
                    }

                    $testIdStr = $test['id'] ?? '';
                    if (isset($existingTestIds[$testIdStr])) {
                        $stats['skipped']++;
                        continue;
                    }

                    $metrics = ['weight' => $test['weight'] ?? null, 'testType' => $test['testType'] ?? null];
                    $teamId = $test['teamId'] ?? '';

                    if ($teamId && $testIdStr) {
                        try {
                            $trialsData = $this->getTrials($teamId, $testIdStr);
                            if (is_array($trialsData) && !empty($trialsData)) {
                                $bestJumpHeight = -1.0;
                                $bestMetrics = [];

                                foreach ($trialsData as $trial) {
                                    if (!isset($trial['results']) || !is_array($trial['results'])) continue;
                                    
                                    $trialMetrics = [];
                                    $trialJumpHeight = 0;

                                    foreach ($trial['results'] as $res) {
                                        $def  = strtoupper($res['definition']['result'] ?? '');
                                        $val  = $res['value'] ?? null;
                                        $limb = $res['limb'] ?? 'Trial';
                                        if (!$def || $val === null) continue;

                                        $keyToStore = null;
                                        if ($limb === 'Trial') {
                                            if ($def === 'RSI_MODIFIED') {
                                                // Scaling factor correction (already handled in Hub v2 but kept for safety)
                                                $val = round((float)$val > 3.0 ? (float)$val / 100.0 : (float)$val, 3);
                                                $keyToStore = 'RSIModified';
                                            }
                                            
                                            // New Priority: Jump Height (Flight Time) as requested by user
                                            if (in_array($def, ['JUMP_HEIGHT_FLIGHT_TIME', 'FLIGHT_TIME_JUMP_HEIGHT', 'JUMP_HEIGHT', 'ESTIMATED_JUMP_HEIGHT', 'JUMP_HEIGHT_IMPULSE', 'JUMP_HEIGHT_IMP_MOM', 'JUMP_HEIGHT_IMPULSE_MOMENTUM'])) {
                                                $val = (float)$val < 1.0 ? (float)$val * 100.0 : (float)$val; // m to cm
                                                $keyToStore = 'JumpHeight';
                                                
                                                // Favor Flight Time (explicitly requested by user)
                                                $isFlightTime = (strpos($def, 'FLIGHT') !== false);
                                                if ($isFlightTime || !isset($trialMetrics['JumpHeight'])) {
                                                    $trialMetrics['JumpHeight'] = ['Value' => round((float)$val, 1)];
                                                    $trialJumpHeight = (float)$val;
                                                }
                                                continue; 
                                            }

                                            if ($def === 'PEAK_FORCE') $keyToStore = 'PeakForce';
                                            if (in_array($def, ['BRAKING_IMPULSE', 'ECCENTRIC_BRAKING_IMPULSE', 'BRAKING_PHASE_IMPULSE', 'BRAKING_PHASE_NET_IMPULSE', 'NET_BRAKING_IMPULSE', 'ECC_BRAKING_IMPULSE'])) $keyToStore = 'BrakingImpulse';
                                            if ($def === 'CONCENTRIC_PEAK_FORCE') $keyToStore = 'ConcentricPeakForce';
                                            if ($def === 'CONCENTRIC_PEAK_POWER') $keyToStore = 'ConcentricPeakPower';
                                            if ($def === 'CONCENTRIC_PEAK_VELOCITY') $keyToStore = 'ConcentricPeakVelocity';
                                            if (in_array($def, ['PEAK_LANDING_FORCE', 'LANDING_PEAK_FORCE'])) $keyToStore = 'PeakLandingForce';
                                            if ($def === 'TIME_TO_TAKEOFF') { $val = (float)$val * 1000; $keyToStore = 'TimeToTakeoff'; }
                                            if ($def === 'CONTRACTION_TIME') { $val = (float)$val * 1000; $keyToStore = 'ContractionTime'; }
                                        }

                                        if ($limb === 'Left') {
                                            if (in_array($def, ['PEAK_FORCE', 'PEAK_FORCE_LEFT'])) $keyToStore = 'PeakForceLeft';
                                            if (in_array($def, ['PEAK_LANDING_FORCE', 'LANDING_PEAK_FORCE', 'LANDING_FORCE_LEFT', 'PEAK_LANDING_FORCE_LEFT'])) $keyToStore = 'LandingForceLeft';
                                        }
                                        if ($limb === 'Right') {
                                            if (in_array($def, ['PEAK_FORCE', 'PEAK_FORCE_RIGHT'])) $keyToStore = 'PeakForceRight';
                                            if (in_array($def, ['PEAK_LANDING_FORCE', 'LANDING_PEAK_FORCE', 'LANDING_FORCE_RIGHT', 'PEAK_LANDING_FORCE_RIGHT'])) $keyToStore = 'LandingForceRight';
                                        }

                                        if ($keyToStore !== null) {
                                            $decimals = match(true) {
                                                in_array($keyToStore, ['TimeToTakeoff', 'ContractionTime']) => 0,
                                                in_array($keyToStore, ['ConcentricPeakVelocity', 'RSIModified']) => 3,
                                                default => 1,
                                            };
                                            $trialMetrics[$keyToStore] = ['Value' => round((float)$val, $decimals)];
                                        }
                                    }

                                    // Selection logic: Pick the trial with the highest JumpHeight (Performance)
                                    // or PeakForce if no JumpHeight is found (Static tests)
                                    $score = $trialJumpHeight > 0 ? $trialJumpHeight : ($trialMetrics['PeakForce']['Value'] ?? 0) / 100;
                                    if ($score > $bestJumpHeight) {
                                        $bestJumpHeight = $score;
                                        $bestMetrics = $trialMetrics;
                                    }
                                }

                                // Use the best trial's metrics for the entire session
                                if (!empty($bestMetrics)) {
                                    $metrics = array_merge($metrics, $bestMetrics);
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

                    $existingTestIds[$testIdStr] = true;

                    if (!empty($test['weight'])) {
                        $stmtW = $db->prepare('UPDATE athletes SET weight_kg = :w WHERE id = :id AND tenant_id = :tid');
                        $stmtW->execute([':w' => round((float)$test['weight'], 1), ':id' => $athleteId, ':tid' => $tenantId]);
                    }

                    $stats['synced']++;
                }

                if (count($pageResults) < 50) break;
                $page++;
                if ($page > 50) break;
            }
        }

        error_log('[VALD Sync] Completata: ' . $stats['synced'] . ' salvati, ' . $stats['skipped'] . ' saltati su ' . $stats['found'] . ' trovati.');
        return $stats;
    }

    /**
     * REPAIR: Re-links orphaned test results to current athletes based on name-matching.
     * Useful when athletes have been migrated to a new tenant with new IDs.
     */
    public function repairLinks(string $tenantId): array
    {
        $db = \FusionERP\Shared\Database::getInstance();
        $stats = ['updated' => 0, 'already_ok' => 0, 'orphaned' => 0];

        // 1. Get all athletes (including deleted) to resolve names across migrations
        $stmt = $db->query("SELECT id, full_name, tenant_id, deleted_at FROM athletes");
        $athletes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $idToName = [];
        $nameToCurrentId = [];

        foreach ($athletes as $a) {
            $idToName[$a['id']] = $a['full_name'];
            if ($a['tenant_id'] === $tenantId && $a['deleted_at'] === null) {
                $nameToCurrentId[$a['full_name']] = $a['id'];
            }
        }

        // 2. Process results
        $stmt = $db->query("SELECT id, athlete_id, tenant_id, test_id FROM vald_test_results");
        $results = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        foreach ($results as $res) {
            $currentAthId = $res['athlete_id'];
            $currentTenant = $res['tenant_id'];
            $originalName = $idToName[$currentAthId] ?? null;

            // Already ok?
            if ($currentTenant === $tenantId && isset($nameToCurrentId[$originalName ?? '']) && $nameToCurrentId[$originalName] === $currentAthId) {
                $stats['already_ok']++;
                continue;
            }

            if ($originalName && isset($nameToCurrentId[$originalName])) {
                $newAthId = $nameToCurrentId[$originalName];
                $upd = $db->prepare('UPDATE vald_test_results SET tenant_id = :tid, athlete_id = :aid WHERE id = :id');
                $upd->execute([':tid' => $tenantId, ':aid' => $newAthId, ':id' => $res['id']]);
                $stats['updated']++;
            } else {
                $stats['orphaned']++;
            }
        }

        // 3. Refresh caches
        if ($stats['updated'] > 0) {
            $db->query("UPDATE athletes a 
                        SET 
                          latest_vald_metrics = (SELECT metrics FROM vald_test_results WHERE athlete_id = a.id ORDER BY test_date DESC LIMIT 1),
                          latest_vald_date = (SELECT test_date FROM vald_test_results WHERE athlete_id = a.id ORDER BY test_date DESC LIMIT 1)
                        WHERE tenant_id = '$tenantId'");
        }

        return $stats;
    }
}