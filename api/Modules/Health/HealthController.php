<?php
/**
 * Health Controller — Medical Certificates & Injuries
 * Fusion ERP v1.0 — Module C
 */

declare(strict_types=1);

namespace FusionERP\Modules\Health;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;
use FusionERP\Shared\AIService;

class HealthController
{
    private HealthRepository $repo;

    public function __construct()
    {
        $this->repo = new HealthRepository();
    }

    // ─── POST ?module=health&action=updateCertificate ────────────────────────

    public function updateCertificate(): void
    {
        Auth::requireWrite('health');
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id']);

        $this->repo->updateCertificate($body['athlete_id'], [
            ':cert_type' => $body['cert_type'] ?? null,
            ':expires_at' => $body['expires_at'] ?? null,
            ':issued_at' => $body['issued_at'] ?? null,
            ':file_path' => $body['file_path'] ?? null,
        ]);

        Audit::log('UPDATE', 'athletes', $body['athlete_id'], null, [
            'field' => 'medical_certificate',
            'cert_type' => $body['cert_type'] ?? null,
            'expires_at' => $body['expires_at'] ?? null,
        ]);

        Response::success(['message' => 'Certificato medico aggiornato']);
    }

    // ─── GET ?module=health&action=getCertificateStatus&id=ATH_xxx ───────────

    public function getCertificateStatus(): void
    {
        Auth::requireRead('health');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? filter_input(INPUT_GET, 'athlete_id', FILTER_DEFAULT) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $status = $this->repo->getCertificateStatus($athleteId);
        Response::success($status);
    }

    // ─── ANAMNESI ────────────────────────────────────────────────────────────

    public function getAnamnesi(): void
    {
        Auth::requireRead('health');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? filter_input(INPUT_GET, 'athlete_id', FILTER_DEFAULT) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $anamnesi = $this->repo->getAnamnesi($athleteId);
        Response::success($anamnesi);
    }

    public function updateAnamnesi(): void
    {
        Auth::requireWrite('health');
        $body = $_POST;
        Response::requireFields($body, ['athlete_id']);

        $this->repo->updateAnamnesi($body['athlete_id'], [
            ':blood_group' => $body['blood_group'] ?? $body['blood_type'] ?? null,
            ':allergies' => $body['allergies'] ?? null,
            ':medications' => $body['medications'] ?? null,
            ':chronic_diseases' => $body['chronic_conditions'] ?? $body['chronic_diseases'] ?? null, // UI currently sends chronic_conditions
            ':past_surgeries' => $body['past_surgeries'] ?? null,
            ':past_injuries' => $body['past_injuries'] ?? null,
            ':chronic_orthopedic_issues' => $body['chronic_orthopedic_issues'] ?? null,
            ':orthopedic_aids' => $body['orthopedic_aids'] ?? null,
        ]);

        Audit::log('UPDATE', 'athletes_health', $body['athlete_id'], null, $body);
        Response::success(['message' => 'Anamnesi aggiornata']);
    }

    // ─── POST ?module=health&action=addInjury ────────────────────────────────

    public function addInjury(): void
    {
        Auth::requireWrite('health');
        $user = Auth::user();
        $body = $_POST;
        Response::requireFields($body, ['athlete_id', 'injury_date']);

        $id = 'INJ_' . bin2hex(random_bytes(4));
        $tenantId = TenantContext::id();

        $this->repo->insertInjury([
            ':id' => $id,
            ':tenant_id' => $tenantId,
            ':athlete_id' => $body['athlete_id'],
            ':injury_date' => $body['injury_date'],
            ':type' => !empty($body['injury_type']) ? $body['injury_type'] : 'Altro',
            ':body_part' => !empty($body['body_part']) ? $body['body_part'] : 'Non specificato',
            ':severity' => !empty($body['severity']) ? $body['severity'] : 'moderate',
            ':stop_days' => 0,
            ':return_date' => !empty($body['rtp_cleared']) ? (!empty($body['estimated_return_date']) ? $body['estimated_return_date'] : date('Y-m-d')) : null,
            ':notes' => !empty($body['description']) ? $body['description'] : null,
            ':treated_by' => !empty($user['full_name']) ? $user['full_name'] : null,
            ':created_by' => $user['id'],
            ':location_context' => null,
            ':side' => null,
            ':mechanism' => !empty($body['mechanism']) ? $body['mechanism'] : null,
            ':official_diagnosis' => !empty($body['diagnosis']) ? $body['diagnosis'] : null,
            ':diagnosis_date' => null,
            ':diagnosed_by' => null,
            ':instrumental_tests' => null,
            ':test_results' => null,
            ':is_recurrence' => 0,
            ':treatment_type' => null,
            ':surgery_date' => null,
            ':physio_plan' => !empty($body['treatment']) ? $body['treatment'] : null,
            ':assigned_physio' => null,
            ':current_status' => !empty($body['rtp_cleared']) ? 'CLEARED' : 'INJURED',
            ':estimated_recovery_time' => null,
            ':estimated_return_date' => !empty($body['expected_rtp_date']) ? $body['expected_rtp_date'] : null,
            ':medical_clearance_given' => !empty($body['rtp_cleared']) ? 1 : 0,
        ]);

        Audit::log('INSERT', 'injury_records', $id, null, $body);
        Response::success(['id' => $id, 'message' => 'Infortunio registrato'], 201);
    }

    // ─── GET ?module=health&action=getInjuries&id=ATH_xxx ────────────────────

    public function getInjuries(): void
    {
        Auth::requireRead('health');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? filter_input(INPUT_GET, 'athlete_id', FILTER_DEFAULT) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $injuries = $this->repo->getInjuries($athleteId);
        
        $mapped = array_map(function($i) {
            $i['injury_type'] = $i['type'];
            $i['description'] = $i['notes'];
            $i['diagnosis'] = $i['official_diagnosis'];
            $i['treatment'] = $i['physio_plan'];
            $i['expected_rtp_date'] = $i['estimated_return_date'];
            $i['rtp_cleared'] = (int)$i['medical_clearance_given'];
            $i['estimated_return_date'] = $i['return_date']; // FE name vs DB name
            return $i;
        }, $injuries);

        Response::success($mapped);
    }

    // ─── POST ?module=health&action=updateInjury ─────────────────────────────

    public function updateInjury(): void
    {
        Auth::requireWrite('health');
        $body = $_POST;
        Response::requireFields($body, ['injury_id']); // actually named injury_id from FE form

        $keyMap = [
            'injury_date' => 'injury_date',
            'injury_type' => 'type',
            'body_part' => 'body_part',
            'severity' => 'severity',
            'mechanism' => 'mechanism',
            'description' => 'notes',
            'diagnosis' => 'official_diagnosis',
            'treatment' => 'physio_plan',
            'expected_rtp_date' => 'estimated_return_date',
            'estimated_return_date' => 'return_date', // actual resolved date
            'rtp_cleared' => 'medical_clearance_given'
        ];

        $updateData = [];
        foreach ($keyMap as $feKey => $dbKey) {
            if (array_key_exists($feKey, $body)) {
                $val = $body[$feKey];
                
                // Fix for Incorrect date value: '' (and general empty string mapped to null)
                // if val is an empty string, we set it to null to avoid SQL strict mode errors
                // except for string fields that MUST be NOT NULL, but those are validated elsewhere (e.g. body_part)
                if ($val === '') {
                    $val = null;
                }

                if ($dbKey === 'medical_clearance_given') {
                    $val = !empty($val) ? 1 : 0;
                    if ($val === 1 && empty($body['estimated_return_date'])) {
                        $updateData[':return_date'] = date('Y-m-d');
                    }
                    if ($val === 1) {
                        $updateData[':current_status'] = 'CLEARED';
                    } else {
                        $updateData[':current_status'] = 'INJURED';
                    }
                }
                
                // Ensure NOT NULL fields fallback to default values
                if ($val === null) {
                    if ($dbKey === 'type') $val = 'Altro';
                    if ($dbKey === 'body_part') $val = 'Non specificato';
                    if ($dbKey === 'severity') $val = 'moderate';
                }

                $updateData[":$dbKey"] = $val;
            }
        }

        if (empty($updateData)) {
            Response::success(['message' => 'Niente da aggiornare']);
        }

        $this->repo->updateInjury($body['injury_id'], $updateData);

        Audit::log('UPDATE', 'injury_records', $body['injury_id'], null, $body);
        Response::success(['message' => 'Infortunio aggiornato']);
    }

    // ─── INJURY FOLLOWUPS & DOCUMENTS ────────────────────────────────────────

    public function getFollowups(): void
    {
        Auth::requireRead('health');
        $injuryId = filter_input(INPUT_GET, 'injury_id', FILTER_DEFAULT) ?? '';
        if (empty($injuryId)) {
            Response::error('injury_id obbligatorio', 400);
        }

        $list = $this->repo->getInjuryFollowups((string)TenantContext::id(), $injuryId);
        Response::success($list);
    }

    public function addFollowup(): void
    {
        Auth::requireWrite('health');
        $body = $_POST;
        Response::requireFields($body, ['injury_id', 'visit_date']);

        $this->repo->addInjuryFollowup([
            'tenant_id' => TenantContext::id(),
            'injury_id' => $body['injury_id'],
            'visit_date' => $body['visit_date'],
            'practitioner' => $body['practitioner'] ?? null,
            'notes' => $body['notes'] ?? null,
            'outcome' => $body['outcome'] ?? null
        ]);

        Response::success(['message' => 'Visita aggiunta']);
    }

    public function getDocuments(): void
    {
        Auth::requireRead('health');
        $injuryId = filter_input(INPUT_GET, 'injury_id', FILTER_DEFAULT) ?? '';
        if (empty($injuryId)) {
            Response::error('injury_id obbligatorio', 400);
        }

        $list = $this->repo->getInjuryDocuments((string)TenantContext::id(), $injuryId);
        Response::success($list);
    }

    public function uploadDocument(): void
    {
        Auth::requireWrite('health');
        
        $injuryId = $_POST['injury_id'] ?? null;
        $docTitle = $_POST['document_title'] ?? 'Documento Senza Nome';
        $docType = $_POST['document_type'] ?? 'Referto';
        
        if (!$injuryId || !isset($_FILES['document_file'])) {
            Response::error('Dati mancanti (injury_id o file).', 400);
        }

        $file = $_FILES['document_file'];
        if ($file['error'] !== UPLOAD_ERR_OK) {
            Response::error('Errore durante l\'upload del file.', 400);
        }

        $tenantId = TenantContext::id();
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'inj_' . bin2hex(random_bytes(6)) . '.' . $ext;
        
        // Setup upload dir
        $uploadDir = __DIR__ . '/../../../uploads/' . $tenantId . '/health/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destPath = $uploadDir . $fileName;
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Salvataggio file fallito sul server.', 500);
        }

        // Relative path for DB
        $relPath = "uploads/{$tenantId}/health/{$fileName}";

        $this->repo->addInjuryDocument([
            'tenant_id' => $tenantId,
            'injury_id' => $injuryId,
            'document_title' => $docTitle,
            'document_type' => $docType,
            'file_path' => $relPath
        ]);

        Response::success(['message' => 'Documento caricato con successo', 'file_path' => $relPath]);
    }

    // ─── AI DIAGNOSIS & ASSISTANT ─────────────────────────────────────────────

    public function askAI(): void
    {
        Auth::requireRead('health');
        
        // Handle both application/json and application/x-www-form-urlencoded
        $body = [];
        $raw = file_get_contents('php://input');
        if (!empty($raw)) {
            $decoded = json_decode($raw, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $body = $decoded;
            } else {
                parse_str($raw, $body);
            }
        }
        if (empty($body)) {
            $body = $_POST;
        }

        if (empty($body['athlete_id'])) {
            Response::error("athlete_id mancante", 400);
        }
        
        $athleteId = $body['athlete_id'];
        $message = $body['message'] ?? '';
        $history = $body['history'] ?? [];

        // Gather athlete data
        $anamnesi = $this->repo->getAnamnesi($athleteId);
        $injuries = $this->repo->getInjuries($athleteId);

        $context = "Hai il ruolo di Assistente Medico Sportivo Avanzato in Fusion ERP. Ti vengono forniti i dati anamnestici, la storia clinica e degli infortuni di un determinato atleta.\n";
        $context .= "Il tuo compito è restituire una diagnosi precisa e suggerire una terapia o un percorso di riabilitazione. Rispondi con linguaggio clinico formale e ben strutturato.\n\n";
        
        $context .= "DATI ANAMNESTICI DELL'ATLETA:\n";
        $context .= json_encode($anamnesi, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
        
        $context .= "LISTA INFORTUNI ED EVENTI MEDICI (con status e note):\n";
        $context .= json_encode($injuries, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";
        
        if (empty($history) && empty($message)) {
            // Initial analysis
            $prompt = $context . "Sulla base di tutti questi dati, analizza accuratamente la situazione medica globale dell'atleta. Fornisci un quadro diagnostico di sintesi, evidenzia eventuali correlazioni tra infortuni pregressi e anamnesi, e per suggerisci una possibile terapia o indicazione utile per il recupero e la prevenzione.";
        } else {
            // Conversational follow-up
            $prompt = $context . "CRONOLOGIA CHAT CON LO STAFF MEDICO:\n";
            if (is_array($history)) {
                foreach ($history as $msg) {
                    $role = strtoupper($msg['role'] ?? 'USER'); 
                    $content = $msg['content'] ?? '';
                    $prompt .= "$role: $content\n";
                }
            }
            if (!empty($message)) {
                $prompt .= "\nUSER: " . $message . "\n";
            }
            $prompt .= "\nRispondi all'ultimo messaggio e fornisci eventuale followup relativo all'atleta in questione.";
        }

        try {
            $response = AIService::generateContent($prompt);
            Response::success(['reply' => $response]);
        } catch (\Exception $e) {
            Response::error('Errore AI: ' . $e->getMessage(), 500);
        }
    }

}
