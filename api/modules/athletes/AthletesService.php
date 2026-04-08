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
    public function getByUserId(string $userId): array
    {
        $athlete = $this->repo->getAthleteByUserId($userId);
        if (!$athlete) {
            throw new \Exception('Profilo atleta non associato a questo utente.', 404);
        }

        $athlete['acwr'] = $this->calculateACWR($athlete['id']);
        $athlete['metrics'] = $this->repo->getMetricsHistory($athlete['id'], 30);
        
        return $athlete;
    }

    /**
     * Get the logged-in user's profile based on email fallback (Legacy approach).
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
            ':nationality'             => $body['nationality'] ?? null,
            ':blood_group'             => $body['blood_group'] ?? null,
            ':allergies'               => $body['allergies'] ?? null,
            ':medications'             => $body['medications'] ?? null,
            ':emergency_contact_name'  => $body['emergency_contact_name'] ?? null,
            ':emergency_contact_phone' => $body['emergency_contact_phone'] ?? null,
            ':communication_preference' => $body['communication_preference'] ?? 'email',
            ':image_release_consent'   => isset($body['image_release_consent']) ? (int)$body['image_release_consent'] : 0,
            ':medical_cert_issued_at'  => $body['medical_cert_issued_at'] ?? null,
            ':photo_release_file_path' => $body['photo_release_file_path'] ?? null,
            ':privacy_policy_file_path' => $body['privacy_policy_file_path'] ?? null,
            ':guesthouse_rules_file_path' => $body['guesthouse_rules_file_path'] ?? null,
            ':guesthouse_delegate_file_path' => $body['guesthouse_delegate_file_path'] ?? null,
            ':health_card_file_path' => $body['health_card_file_path'] ?? null,
            ':registration_fee_paid' => isset($body['registration_fee_paid']) ? (int)$body['registration_fee_paid'] : 0,
            ':monthly_fee_amount' => $body['monthly_fee_amount'] ?? null,
        ];

        $this->repo->createAthlete($data);
        $this->repo->setAthleteTeams($id, $teamSeasonIds, $primaryTeamId);

        Audit::log('INSERT', 'athletes', $id, null, ['first_name' => $body['first_name'], 'last_name' => $body['last_name'], 'team_season_ids' => $teamSeasonIds]);
        return ['id' => $id];
    }

    /**
     * Generate a system user for an existing athlete.
     */
    public function generateAthleteUser(string $athleteId): array
    {
        $athlete = $this->repo->getAthleteById($athleteId);
        if (!$athlete) {
            throw new \Exception('Atleta non trovato', 404);
        }

        if (empty($athlete['email'])) {
            throw new \Exception('L\'atleta non ha una mail inserita. Impossibile generare l\'utente.', 400);
        }

        if (!empty($athlete['user_id'])) {
            throw new \Exception('L\'atleta ha già un utente associato.', 400);
        }

        // Reuse Auth logic to create user
        $authRepo = new \FusionERP\Modules\Auth\AuthRepository();
        $email = strtolower(trim($athlete['email']));
        
        if ($authRepo->getUserByEmail($email) !== null) {
            throw new \Exception('Questa email è già in uso da un altro utente nel sistema.', 400);
        }

        $tempPassword = bin2hex(random_bytes(10));
        $hash = password_hash($tempPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $userId = 'USR_' . bin2hex(random_bytes(4));

        $authRepo->createUser([
            'id' => $userId,
            'email' => $email,
            'pwd_hash' => $hash,
            'role' => 'atleta',
            'full_name' => $athlete['full_name'],
            'phone' => $athlete['phone'] ?? null,
            'permissions_json' => null
        ]);

        $this->repo->linkUserToAthlete($athleteId, $userId);

        // Send Welcome Email
        $appUrl = rtrim(getenv('APP_URL') ?: 'https://www.fusionteamvolley.it/ERP', '/');
        $subject = "Benvenuto nel Portale Atleti Fusion ERP";
        $htmlBody = "
            <body style=\"font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;\">
                <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;\">
                    <div style=\"background-color: #e5005c; color: #ffffff; padding: 20px; text-align: center;\">
                        <h1 style=\"margin: 0; font-size: 24px;\">Portale Atleti Fusion</h1>
                    </div>
                    <div style=\"padding: 30px;\">
                        <p>Ciao <strong>{$athlete['full_name']}</strong>,</p>
                        <p>Il tuo account per il portale atleti è stato attivato.</p>
                        <p>Puoi accedere per visualizzare i tuoi dati, le quote e le metriche di performance.</p>
                        <div style=\"background-color: #f9f9f9; padding: 15px; border-left: 4px solid #e5005c;\">
                            <p><strong>Email:</strong> {$email}</p>
                            <p><strong>Password Temporanea:</strong> {$tempPassword}</p>
                        </div>
                        <p style=\"margin-top: 20px;\"><a href=\"{$appUrl}/\" style=\"background: #e5005c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;\">Accedi Ora</a></p>
                    </div>
                </div>
            </body>";

        \FusionERP\Shared\Mailer::send($email, $athlete['full_name'], $subject, $htmlBody);
        
        Audit::log('USER_GENERATED', 'athletes', $athleteId, null, ['user_id' => $userId, 'email' => $email]);
        
        return ['message' => 'Utente generato correttamente e mail inviata.', 'user_id' => $userId];
    }

    /**
     * Update limited profile data (for athlete self-service).
     */
    public function updateAthleteBasic(string $athleteId, array $data): void
    {
        $allowedFields = [
            'residence_address', 'residence_city', 'phone', 'email', 
            'emergency_contact_name', 'emergency_contact_phone', 
            'communication_preference', 'shirt_size', 'shoe_size'
        ];

        $updateData = [];
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $data)) {
                $updateData[":{$field}"] = $data[$field];
            }
        }

        if (empty($updateData)) {
            throw new \Exception('Nessun dato valido fornito per l\'aggiornamento.', 400);
        }

        $before = $this->repo->getAthleteById($athleteId);
        $this->repo->updateAthlete($athleteId, $updateData);
        Audit::log('UPDATE_BASIC', 'athletes', $athleteId, $before, $data);
    }

    /**
     * Generate an AI report for the athlete using Gemini.
     * PERF: Checks for an existing summary created in the last 24h to avoid redundant API calls.
     */
    public function generateAIReport(string $athleteId): array
    {
        $athlete = $this->repo->getAthleteById($athleteId);
        if (!$athlete) {
            throw new \Exception('Atleta non trovato', 404);
        }

        // 1. PERFORMANCE: Check if a summary already exists for today/last 24h
        $latest = $this->repo->getLatestAiSummary($athleteId);
        if ($latest && (time() - strtotime($latest['created_at'])) < 86400) {
            return [
                'summary' => $latest['summary_text'],
                'period' => ['start' => $latest['period_start'], 'end' => $latest['period_end']],
                'cached' => true
            ];
        }

        $history = $this->repo->getMetricsHistory($athleteId, 30);
        $acwr = $this->calculateACWR($athleteId);
        $notes = $this->repo->getCoachNotes($athleteId, 10);

        // Rate Limiting basato su sessione (gestito dal Controller tramite handleServiceCall)
        $prompt = $this->buildGeminiPrompt($athlete, $history, $acwr, $notes);
        
        try {
            // AIService now defaults to gemini-flash-latest which is stable and state-of-the-art.
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
            ':model_version' => 'gemini-1.5-flash',
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
