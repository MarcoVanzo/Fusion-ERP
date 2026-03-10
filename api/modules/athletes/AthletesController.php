<?php
/**
 * Athletes Controller — CRUD, ACWR Calculation, Gemini AI Reports
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Athletes;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;

class AthletesController
{
    private AthletesRepository $repo;

    public function __construct()
    {
        $this->repo = new AthletesRepository();
    }

    // ─── GET /api/?module=athletes&action=list ────────────────────────────────
    public function list(): void
    {
        Auth::requireRead('athletes');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        Response::success($this->repo->listAthletes($teamId));
    }

    // ─── GET /api/?module=athletes&action=listLight ───────────────────────────
    // PERF: Returns only the fields needed for the athlete card (~75% less payload).
    // Full data is fetched on-demand via action=get when opening a single profile.
    public function listLight(): void
    {
        Auth::requireRead('athletes');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        Response::success($this->repo->listAthletesLight($teamId));
    }


    // ─── GET /api/?module=athletes&action=get&id=ATH_xxx ─────────────────────
    public function get(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $athlete = $this->repo->getAthleteById($id);
        if (!$athlete) {
            Response::error('Atleta non trovato', 404);
        }

        // Append ACWR
        $acwr = $this->calcACWR($id);
        $athlete['acwr'] = $acwr;

        // Append metrics history (30 days)
        $athlete['metrics'] = $this->repo->getMetricsHistory($id, 30);

        Response::success($athlete);
    }

    // ─── POST /api/?module=athletes&action=create ─────────────────────────────
    public function create(): void
    {
        Auth::requireWrite('athletes');
        $body = Response::jsonBody();
        Response::requireFields($body, ['first_name', 'last_name', 'team_id']);

        $id = 'ATH_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':user_id' => $body['user_id'] ?? null,
            ':team_id' => $body['team_id'],
            ':first_name' => htmlspecialchars(trim($body['first_name']), ENT_QUOTES, 'UTF-8'),
            ':last_name' => htmlspecialchars(trim($body['last_name']), ENT_QUOTES, 'UTF-8'),
            ':jersey_number' => isset($body['jersey_number']) ? (int)$body['jersey_number'] : null,
            ':role' => $body['role'] ?? null,
            ':birth_date' => $body['birth_date'] ?? null,
            ':birth_place' => $body['birth_place'] ?? null,
            ':height_cm' => isset($body['height_cm']) ? (int)$body['height_cm'] : null,
            ':weight_kg' => isset($body['weight_kg']) ? (float)$body['weight_kg'] : null,
            ':photo_path' => null,
            ':residence_address' => $body['residence_address'] ?? null,
            ':residence_city' => $body['residence_city'] ?? null,
            ':phone' => $body['phone'] ?? null,
            ':email' => $body['email'] ?? null,
            ':identity_document' => $body['identity_document'] ?? null,
            ':fiscal_code' => $body['fiscal_code'] ?? null,
            ':medical_cert_type' => $body['medical_cert_type'] ?? null,
            ':medical_cert_expires_at' => $body['medical_cert_expires_at'] ?? null,
            ':federal_id' => $body['federal_id'] ?? null,
            ':shirt_size' => $body['shirt_size'] ?? null,
            ':shoe_size' => $body['shoe_size'] ?? null,
            ':parent_contact' => $body['parent_contact'] ?? null,
            ':parent_phone' => $body['parent_phone'] ?? null,
        ];

        $this->repo->createAthlete($data);
        Audit::log('INSERT', 'athletes', $id, null, ['first_name' => $body['first_name'], 'last_name' => $body['last_name']]);
        Response::success(['id' => $id], 201);
    }

    // ─── POST /api/?module=athletes&action=update ─────────────────────────────
    public function update(): void
    {
        Auth::requireWrite('athletes');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'first_name', 'last_name', 'team_id']);

        $before = $this->repo->getAthleteById($body['id']);
        if (!$before) {
            Response::error('Atleta non trovato', 404);
        }

        // Preserve existing values for fields not passed in the request (e.g. from partial form submissions)
        $val = fn($k) => array_key_exists($k, $body) ? $body[$k] : ($before[$k] ?? null);

        $this->repo->updateAthlete($body['id'], [
            ':first_name' => htmlspecialchars(trim($body['first_name']), ENT_QUOTES, 'UTF-8'),
            ':last_name' => htmlspecialchars(trim($body['last_name']), ENT_QUOTES, 'UTF-8'),
            ':jersey_number' => $val('jersey_number'),
            ':role' => $val('role'),
            ':birth_date' => $val('birth_date'),
            ':birth_place' => $val('birth_place'),
            ':height_cm' => $val('height_cm'),
            ':weight_kg' => $val('weight_kg'),
            ':residence_address' => $val('residence_address'),
            ':residence_city' => $val('residence_city'),
            ':phone' => $val('phone'),
            ':email' => $val('email'),
            ':identity_document' => $val('identity_document'),
            ':fiscal_code' => $val('fiscal_code'),
            ':medical_cert_type' => $val('medical_cert_type'),
            ':medical_cert_expires_at' => $val('medical_cert_expires_at'),
            ':federal_id' => $val('federal_id'),
            ':shirt_size' => $val('shirt_size'),
            ':shoe_size' => $val('shoe_size'),
            ':parent_contact' => $val('parent_contact'),
            ':parent_phone' => $val('parent_phone'),
            ':team_id' => $body['team_id'],
        ]);

        Audit::log('UPDATE', 'athletes', $body['id'], $before, $body);
        Response::success(['message' => 'Atleta aggiornato']);
    }

    // ─── POST /api/?module=athletes&action=delete ─────────────────────────────
    public function delete(): void
    {
        Auth::requireWrite('athletes');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getAthleteById($id);
        $this->repo->softDeleteAthlete($id);
        Audit::log('DELETE', 'athletes', $id, $before, null);
        Response::success(['message' => 'Atleta rimosso']);
    }

    // ─── POST /api/?module=athletes&action=uploadPhoto (multipart/form-data) ──
    public function uploadPhoto(): void
    {
        Auth::requireWrite('athletes');

        $id = $_POST['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        $athlete = $this->repo->getAthleteById($id);
        if (!$athlete) {
            Response::error('Atleta non trovato', 404);
        }

        if (empty($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
            Response::error('Nessun file caricato o errore upload', 400);
        }

        $file = $_FILES['photo'];
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        if (!in_array($mimeType, $allowedTypes, true)) {
            Response::error('Formato non supportato (jpg, png, webp)', 400);
        }

        if ($file['size'] > 5 * 1024 * 1024) {
            Response::error('Dimensione massima 5MB', 400);
        }

        $ext = match ($mimeType) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
            };

        $uploadDir = __DIR__ . '/../../../uploads/athlete_photos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Remove old photo if it exists
        if (!empty($athlete['photo_path'])) {
            $oldFile = __DIR__ . '/../../../' . ltrim($athlete['photo_path'], '/');
            if (file_exists($oldFile)) {
                @unlink($oldFile);
            }
        }

        $filename = $id . '_' . time() . '.' . $ext;
        $destPath = $uploadDir . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Errore nel salvataggio del file', 500);
        }

        $relativePath = 'uploads/athlete_photos/' . $filename;
        $this->repo->updatePhotoPath($id, $relativePath);

        Audit::log('PHOTO_UPLOAD', 'athletes', $id, null, ['photo_path' => $relativePath]);
        Response::success(['photo_path' => $relativePath]);
    }


    public function logMetric(): void
    {
        Auth::requireWrite('athletes');
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id', 'log_date', 'duration_min', 'rpe']);

        $athleteId = $body['athlete_id'];
        $durationMin = max(0, (int)$body['duration_min']);
        $rpe = min(10, max(1, (int)$body['rpe']));
        $loadValue = $durationMin * $rpe;

        $metricId = 'MET_' . bin2hex(random_bytes(4));

        // Insert the metric FIRST — ACWR must include the current session
        // (previously it was calculated before insert, making all stored ACWR values lag by 1)
        $this->repo->insertMetric([
            ':id' => $metricId,
            ':athlete_id' => $athleteId,
            ':event_id' => $body['event_id'] ?? null,
            ':log_date' => $body['log_date'],
            ':duration_min' => $durationMin,
            ':rpe' => $rpe,
            ':load_value' => $loadValue,
            ':acwr_score' => 0.0, // placeholder; updated below after recalculation
            ':notes' => $body['notes'] ?? null,
        ]);

        // Now calculate ACWR including the metric just inserted
        $acwr = $this->calcACWR($athleteId);

        // Update the acwr_score in the record we just inserted
        $this->repo->updateMetricAcwr($metricId, $acwr['score']);

        // Insert alert if ACWR is in risk zone (> 1.3)
        $riskLevel = $acwr['risk'];
        if ($riskLevel === 'high' || $riskLevel === 'extreme') {
            $this->repo->insertAcwrAlert($athleteId, $acwr['score'], $riskLevel);
            Audit::log('ACWR_ALERT', 'acwr_alerts', $athleteId, null, $acwr);
        }

        Audit::log('INSERT', 'metrics_logs', $metricId, null, $body);
        Response::success(['id' => $metricId, 'acwr' => $acwr], 201);
    }

    // ─── GET /api/?module=athletes&action=acwr&id=ATH_xxx ────────────────────
    public function acwr(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        Response::success($this->calcACWR($id));
    }

    // ─── POST /api/?module=athletes&action=aiReport ───────────────────────────
    public function aiReport(): void
    {
        Auth::requireWrite('athletes');
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id']);

        $athleteId = $body['athlete_id'];
        $athlete = $this->repo->getAthleteById($athleteId);
        if (!$athlete) {
            Response::error('Atleta non trovato', 404);
        }

        $history = $this->repo->getMetricsHistory($athleteId, 30);
        $acwr = $this->calcACWR($athleteId);
        $notes = $this->repo->getCoachNotes($athleteId, 10);

        // Build Gemini prompt
        $prompt = $this->buildGeminiPrompt($athlete, $history, $acwr, $notes);
        $summary = $this->callGeminiApi($prompt);

        // Save to DB
        $periodStart = date('Y-m-d', strtotime('-30 days'));
        $periodEnd = date('Y-m-d');
        $summaryId = 'SUM_' . bin2hex(random_bytes(4));

        $this->repo->saveAiSummary([
            ':id' => $summaryId,
            ':athlete_id' => $athleteId,
            ':period_start' => $periodStart,
            ':period_end' => $periodEnd,
            ':summary_text' => $summary,
            ':model_version' => 'gemini-2.0-flash',
        ]);

        Audit::log('AI_REPORT', 'ai_summaries', $summaryId, null, ['athlete_id' => $athleteId]);
        Response::success(['summary' => $summary, 'period' => ['start' => $periodStart, 'end' => $periodEnd]]);
    }

    // ─── GET /api/?module=athletes&action=aiSummary&id=ATH_xxx ───────────────
    public function aiSummary(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $summary = $this->repo->getLatestAiSummary($id);
        Response::success($summary);
    }

    // ─── GET /api/?module=athletes&action=activityLog&id=ATH_xxx ─────────────
    public function activityLog(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        Response::success($this->repo->getActivityLog($id));
    }

    // ─── GET /api/?module=athletes&action=alerts ──────────────────────────────
    public function alerts(): void
    {
        $user = Auth::requireRole('manager');
        $tenantId = \FusionERP\Shared\TenantContext::id();
        $alerts = $this->repo->getUnacknowledgedAlerts($tenantId);
        Response::success($alerts);
    }

    // ─── GET /api/?module=athletes&action=teams ───────────────────────────────
    public function teams(): void
    {
        Auth::requireRead('athletes');
        Response::success($this->repo->listTeams());
    }

    // ─── PRIVATE: ACWR Calculation ────────────────────────────────────────────
    /**
     * ACWR = W_acute / W_chronic
     *   W_acute   = Sum of load in last 7 days
     *   W_chronic = Average weekly load over last 28 days (total / 4)
     *
     * Risk zones:
     *   < 0.8          → low (underdone)
     *   0.8  – 1.3     → moderate (optimal)
     *   1.3  – 1.5     → high (caution)
     *   > 1.5          → extreme (danger)
     */
    private function calcACWR(string $athleteId): array
    {
        // PERF: single DB query instead of 2 (merged getAcuteLoad + getChronicLoad)
        ['acute' => $acute, 'chronic' => $chronic] = $this->repo->getAcwrLoads($athleteId);

        if ($chronic <= 0) {
            return ['score' => 0.0, 'acute' => $acute, 'chronic' => 0.0, 'risk' => 'low'];
        }

        $score = round($acute / $chronic, 4);

        $risk = match (true) {
                $score < 0.8 => 'low',
                $score <= 1.3 => 'moderate',
                $score <= 1.5 => 'high',
                default => 'extreme',
            };

        return [
            'score' => $score,
            'acute' => round($acute, 2),
            'chronic' => round($chronic, 2),
            'risk' => $risk,
        ];
    }

    // ─── PRIVATE: Gemini API Call ─────────────────────────────────────────────
    private function buildGeminiPrompt(array $athlete, array $history, array $acwr, array $notes): string
    {
        $historyText = '';
        foreach ($history as $h) {
            $historyText .= "- {$h['log_date']}: {$h['duration_min']}min, RPE {$h['rpe']}, Load {$h['load_value']}\n";
        }

        $notesText = '';
        foreach ($notes as $n) {
            $notesText .= "- {$n['log_date']}: {$n['notes']}\n";
        }

        return <<<PROMPT
Sei un assistente tecnico sportivo per una squadra di basket giovanile.
Ti vengono forniti i dati di carico di lavoro degli ultimi 30 giorni per l'atleta "{$athlete['full_name']}"
(Squadra: {$athlete['team_name']}, Categoria: {$athlete['category']}, Ruolo: {$athlete['role']}).

ACWR attuale: {$acwr['score']} (Carico acuto: {$acwr['acute']} | Carico cronico: {$acwr['chronic']}) → Livello rischio: {$acwr['risk']}

STORICO ALLENAMENTI (ultimi 30 giorni):
{$historyText}

NOTE TECNICO/ALLENATORE:
{$notesText}

Genera un breve riepilogo (max 200 parole) in italiano, chiaro e professionale, che:
1. Descriva l'andamento del carico di allenamento dell'atleta nel periodo.
2. Commenti il valore ACWR e il suo significato per la prevenzione infortuni.
3. Evidenzi eventuali trend positivi o aree di miglioramento.

IMPORTANTE: Questo testo è un supporto informativo per l'allenatore. Non fornire diagnosi mediche né decisioni tecniche autonome.
PROMPT;
    }

    private function callGeminiApi(string $prompt): string
    {
        $apiKey = getenv('GEMINI_API_KEY');
        if (empty($apiKey)) {
            return 'Gemini API key non configurata. Configurare GEMINI_API_KEY nel file .env.';
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";
        $payload = json_encode([
            'contents' => [
                ['parts' => [['text' => $prompt]]]
            ],
            'safetySettings' => [
                ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_NONE'],
            ],
            'generationConfig' => [
                'maxOutputTokens' => 512,
                'temperature' => 0.3,
            ],
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 30,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200 || $response === false) {
            error_log("[GEMINI] API call failed. HTTP {$httpCode}");
            return 'Impossibile generare il riepilogo AI al momento. Riprovare più tardi.';
        }

        $data = json_decode($response, true);
        return $data['candidates'][0]['content']['parts'][0]['text']
            ?? 'Riepilogo non disponibile.';
    }

    // ─── PUBLIC ENDPOINTS FOR WEBSITE ──────────────────────────────────────────────
    public function getPublicTeams(): void
    {
        Response::success($this->repo->listTeams());
    }

    public function getPublicTeamAthletes(): void
    {
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        Response::success($this->repo->listAthletesLight($teamId));
    }
}