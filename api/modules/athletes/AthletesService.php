<?php
/**
 * Athletes Service — Business Logic Layer
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Athletes;

use FusionERP\Shared\Auth;
use FusionERP\Shared\AIService;
use FusionERP\Shared\Audit;

class AthletesService
{
    private AthletesRepository $repo;

    public function __construct()
    {
        $this->repo = new AthletesRepository();
    }

    /**
     * Get athlete profile with ACWR and metrics history.
     */
    public function getProfile(string $id): array
    {
        $athlete = $this->repo->getAthleteById($id);
        if (!$athlete) {
            throw new \Exception('Atleta non trovato', 404);
        }

        $athlete['acwr'] = $this->calculateACWR($id);
        $athlete['metrics'] = $this->repo->getMetricsHistory($id, 30);
        
        return $athlete;
    }

    /**
     * Get the logged-in user's profile (athlete or staff).
     */
    public function getMyProfile(array $user): array
    {
        $email = $user['email'] ?? '';
        if (empty($email)) {
            throw new \Exception('Email utente non disponibile nella sessione.', 400);
        }

        // 1. Try to find an athlete with this email
        $athlete = $this->repo->getAthleteByEmail($email);
        if ($athlete) {
            $athlete['profile_type'] = 'athlete';
            $athlete['api_module'] = 'athletes';
            $athlete['acwr'] = $this->calculateACWR($athlete['id']);
            $athlete['metrics'] = $this->repo->getMetricsHistory($athlete['id'], 30);
            return $athlete;
        }

        // 2. Try to find a staff member with this email
        $staffRepo = new \FusionERP\Modules\Staff\StaffRepository();
        $staff = $staffRepo->getByEmail($email);
        if ($staff) {
            $staff['profile_type'] = 'staff';
            $staff['api_module'] = 'staff';
            
            // Map staff fields to match the frontend expectations
            $staff['team_name'] = $staff['team_names'] ?? 'Staff FTV';
            $staff['id_doc_front_file_path'] = $staff['id_doc_file_path'] ?? null;
            $staff['id_doc_back_file_path'] = $staff['id_doc_back_file_path'] ?? null;
            $staff['cf_doc_front_file_path'] = $staff['cf_doc_file_path'] ?? null;
            $staff['cf_doc_back_file_path'] = $staff['cf_doc_back_file_path'] ?? null;
            $staff['medical_cert_file_path'] = null; 
            return $staff;
        }

        throw new \Exception('Nessun profilo anagrafico trovato per questa email.', 404);
    }

    /**
     * Create a new athlete.
     */
    public function createAthlete(array $body): array
    {
        $teamSeasonIds = !empty($body['team_season_ids']) && is_array($body['team_season_ids'])
            ? array_values(array_filter($body['team_season_ids']))
            : (!empty($body['team_season_id']) ? [$body['team_season_id']] : []);

        if (empty($teamSeasonIds)) {
            throw new \Exception('Selezionare almeno una stagione/squadra', 400);
        }

        if (empty($body['first_name']) || empty($body['last_name'])) {
            throw new \Exception('Nome e cognome obbligatori', 400);
        }

        $id = 'ATH_' . bin2hex(random_bytes(4));
        $primaryTeamSeasonId = $teamSeasonIds[0];
        $primaryTeamId = $this->repo->getTeamIdForSeason($primaryTeamSeasonId) ?: 'UNKNOWN';

        $data = [
            ':id'                      => $id,
            ':user_id'                 => $body['user_id'] ?? null,
            ':team_id'                 => $primaryTeamId,
            ':first_name'              => trim($body['first_name']),
            ':last_name'               => trim($body['last_name']),
            ':jersey_number'           => isset($body['jersey_number']) ? (int)$body['jersey_number'] : null,
            ':role'                    => $body['role'] ?? null,
            ':birth_date'              => $body['birth_date'] ?? null,
            ':birth_place'             => $body['birth_place'] ?? null,
            ':height_cm'               => isset($body['height_cm']) ? (int)$body['height_cm'] : null,
            ':weight_kg'               => isset($body['weight_kg']) ? (float)$body['weight_kg'] : null,
            ':photo_path'              => null,
            ':residence_address'       => $body['residence_address'] ?? null,
            ':residence_city'          => $body['residence_city'] ?? null,
            ':phone'                   => $body['phone'] ?? null,
            ':email'                   => $body['email'] ?? null,
            ':identity_document'       => $body['identity_document'] ?? null,
            ':fiscal_code'             => $body['fiscal_code'] ?? null,
            ':medical_cert_type'       => $body['medical_cert_type'] ?? null,
            ':medical_cert_expires_at' => $body['medical_cert_expires_at'] ?? null,
            ':federal_id'              => $body['federal_id'] ?? null,
            ':shirt_size'              => $body['shirt_size'] ?? null,
            ':shoe_size'               => $body['shoe_size'] ?? null,
            ':parent_contact'          => $body['parent_contact'] ?? null,
            ':parent_phone'            => $body['parent_phone'] ?? null,
        ];

        $this->repo->createAthlete($data);
        $this->repo->setAthleteTeams($id, $teamSeasonIds, $primaryTeamId);

        Audit::log('INSERT', 'athletes', $id, null, ['first_name' => $body['first_name'], 'last_name' => $body['last_name'], 'team_season_ids' => $teamSeasonIds]);
        return ['id' => $id];
    }

    /**
     * Generate an AI report for the athlete using Gemini.
     */
    public function generateAIReport(string $athleteId): array
    {
        $athlete = $this->repo->getAthleteById($athleteId);
        if (!$athlete) {
            throw new \Exception('Atleta non trovato', 404);
        }

        $history = $this->repo->getMetricsHistory($athleteId, 30);
        $acwr = $this->calculateACWR($athleteId);
        $notes = $this->repo->getCoachNotes($athleteId, 10);

        // Rate Limiting basato su sessione (gestito dal Controller tramite handleServiceCall)
        $prompt = $this->buildGeminiPrompt($athlete, $history, $acwr, $notes);
        
        try {
            $summary = AIService::generateContent($prompt, ['maxOutputTokens' => 512, 'temperature' => 0.3]);
        } catch (\Exception $e) {
            $summary = 'Impossibile generare il riepilogo AI al momento. Riprovare più tardi.';
        }

        $periodStart = date('Y-m-d', strtotime('-30 days'));
        $periodEnd = date('Y-m-d');
        $summaryId = 'SUM_' . bin2hex(random_bytes(4));

        $this->repo->saveAiSummary([
            ':id' => $summaryId,
            ':athlete_id' => $athleteId,
            ':period_start' => $periodStart,
            ':period_end' => $periodEnd,
            ':summary_text' => $summary,
            ':model_version' => 'gemini-2.5-flash',
        ]);

        Audit::log('AI_REPORT', 'ai_summaries', $summaryId, null, ['athlete_id' => $athleteId]);
        return ['summary' => $summary, 'period' => ['start' => $periodStart, 'end' => $periodEnd]];
    }

    /**
     * Recalculate ACWR for an athlete.
     */
    public function calculateACWR(string $athleteId): array
    {
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
            'score'   => $score,
            'acute'   => round($acute, 2),
            'chronic' => round($chronic, 2),
            'risk'    => $risk,
        ];
    }

    /**
     * Internal helper to build Gemini prompts.
     */
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

        $athleteName = $athlete['full_name'] ?? ($athlete['first_name'] . ' ' . $athlete['last_name']);
        $teamName = $athlete['team_name'] ?? 'Nessuna';
        $category = $athlete['category'] ?? 'Nessuna';
        $role = $athlete['role'] ?? '—';

        return <<<PROMPT
Sei un assistente tecnico sportivo per una squadra di basket giovanile.
Ti vengono forniti i dati di carico di lavoro degli ultimi 30 giorni per l'atleta "{$athleteName}"
(Squadra: {$teamName}, Categoria: {$category}, Ruolo: {$role}).

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
}
