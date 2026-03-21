<?php
/**
 * Network Controller — CRUD for network_* tables
 * Fusion ERP v1.0
 *
 * Endpoints (all via ?module=network&action=…):
 *   listCollaborations / createCollaboration / updateCollaboration / deleteCollaboration
 *   listColDocuments / uploadColDocument / downloadColDocument / deleteColDocument
 *   listTrials / createTrial / updateTrial / deleteTrial
 *   evaluateTrial              — POST new evaluation row for a trial
 *   listEvaluations            — GET evaluations for a trial
 *   convertToScouting          — converts trial to scouting profile
 *   listActivities / createActivity / updateActivity / deleteActivity
 *   uploadColLogo              — POST upload logo for a collaboration
 */

declare(strict_types=1);

namespace FusionERP\Modules\Network;

$_networkShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_networkShared . 'Auth.php';
require_once $_networkShared . 'Audit.php';
require_once $_networkShared . 'Response.php';
require_once $_networkShared . 'TenantContext.php';
unset($_networkShared);
require_once __DIR__ . '/NetworkRepository.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class NetworkController
{
    private NetworkRepository $repo;

    private const MAX_FILE_SIZE = 10 * 1024 * 1024;

    private const ALLOWED_MIMES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    ];

    public function __construct()
    {
        $this->repo = new NetworkRepository();
    }

    // ─── COLLABORATIONS ───────────────────────────────────────────────────────

    public function listCollaborations(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listCollaborations());
    }

    public function createCollaboration(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['partner_name']);

        $validTypes = ['club', 'agenzia', 'istituzione', 'sponsor', 'altro'];
        $validStatuses = ['attivo', 'scaduto', 'in_rinnovo'];
        $partnerType = $body['partner_type'] ?? 'altro';
        $status = $body['status'] ?? 'attivo';

        if (!in_array($partnerType, $validTypes, true)) {
            Response::error("Tipo partner non valido: {$partnerType}", 400);
        }
        if (!in_array($status, $validStatuses, true)) {
            Response::error("Stato non valido: {$status}", 400);
        }

        $id = 'NCL_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => TenantContext::id(),
            ':partner_name' => htmlspecialchars(trim($body['partner_name']), ENT_QUOTES, 'UTF-8'),
            ':partner_type' => $partnerType,
            ':agreement_type' => $body['agreement_type'] ?? null,
            ':start_date' => $body['start_date'] ?? null,
            ':end_date' => $body['end_date'] ?? null,
            ':status' => $status,
            ':referent_name' => $body['referent_name'] ?? null,
            ':referent_contact' => $body['referent_contact'] ?? null,
            ':notes' => $body['notes'] ?? null,
            ':logo_path' => $body['logo_path'] ?? null,
            ':website' => isset($body['website']) ? trim($body['website']) : null,
            ':instagram' => isset($body['instagram']) ? trim($body['instagram']) : null,
            ':facebook' => isset($body['facebook']) ? trim($body['facebook']) : null,
            ':youtube' => isset($body['youtube']) ? trim($body['youtube']) : null,
            ':description' => isset($body['description']) ? htmlspecialchars(trim($body['description']), ENT_QUOTES, 'UTF-8') : null,
        ];

        $this->repo->createCollaboration($data);
        Audit::log('INSERT', 'network_collaborations', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateCollaboration(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'partner_name']);

        $before = $this->repo->getCollaborationById($body['id']);
        if (!$before) {
            Response::error('Collaborazione non trovata', 404);
        }

        $validTypes = ['club', 'agenzia', 'istituzione', 'sponsor', 'altro'];
        $validStatuses = ['attivo', 'scaduto', 'in_rinnovo'];
        $partnerType = $body['partner_type'] ?? 'altro';
        $status = $body['status'] ?? 'attivo';

        if (!in_array($partnerType, $validTypes, true)) {
            Response::error("Tipo partner non valido: {$partnerType}", 400);
        }
        if (!in_array($status, $validStatuses, true)) {
            Response::error("Stato non valido: {$status}", 400);
        }

        $data = [
            ':partner_name' => htmlspecialchars(trim($body['partner_name']), ENT_QUOTES, 'UTF-8'),
            ':partner_type' => $partnerType,
            ':agreement_type' => $body['agreement_type'] ?? null,
            ':start_date' => $body['start_date'] ?? null,
            ':end_date' => $body['end_date'] ?? null,
            ':status' => $status,
            ':referent_name' => $body['referent_name'] ?? null,
            ':referent_contact' => $body['referent_contact'] ?? null,
            ':notes' => $body['notes'] ?? null,
            ':logo_path' => $body['logo_path'] ?? $before['logo_path'] ?? null,
            ':website' => isset($body['website']) ? trim($body['website']) : null,
            ':instagram' => isset($body['instagram']) ? trim($body['instagram']) : null,
            ':facebook' => isset($body['facebook']) ? trim($body['facebook']) : null,
            ':youtube' => isset($body['youtube']) ? trim($body['youtube']) : null,
            ':description' => isset($body['description']) ? htmlspecialchars(trim($body['description']), ENT_QUOTES, 'UTF-8') : null,
        ];

        $this->repo->updateCollaboration($body['id'], $data);
        Audit::log('UPDATE', 'network_collaborations', $body['id'], $before, $body);
        Response::success(['message' => 'Collaborazione aggiornata']);
    }

    public function uploadColLogo(): void
    {
        Auth::requireRole('manager');

        $collabId = $_POST['collaboration_id'] ?? '';
        if (empty($collabId)) {
            Response::error('collaboration_id obbligatorio', 400);
        }

        $collab = $this->repo->getCollaborationById($collabId);
        if (!$collab) {
            Response::error('Collaborazione non trovata', 404);
        }

        if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $_FILES['logo']['error'] ?? -1;
            Response::error("Errore upload logo (codice: {$errorCode})", 400);
        }

        $file = $_FILES['logo'];

        if ($file['size'] > self::MAX_FILE_SIZE) {
            Response::error('File troppo grande (max 10 MB)', 400);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!in_array($mime, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'], true)) {
            Response::error('Tipo file non consentito. Accettati: JPG, PNG, WEBP, SVG', 400);
        }

        $tenantId = TenantContext::id();
        $safeId = preg_replace('/[^A-Za-z0-9_]/', '', $collabId);
        $uploadDir = dirname(__DIR__, 3) . '/uploads/network/' . $tenantId . '/' . $safeId . '/logo';
        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                Response::error('Impossibile creare la directory di upload per il logo', 500);
            }
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'logo_' . date('Ymd_His') . '.' . $ext;
        $destPath = $uploadDir . '/' . $fileName;

        if (!@move_uploaded_file($file['tmp_name'], $destPath)) {
            if (!@rename($file['tmp_name'], $destPath) && !@copy($file['tmp_name'], $destPath)) {
                $err = error_get_last();
                $msg = $err ? $err['message'] : 'Sconosciuto';
                Response::error('Errore nel salvataggio del logo: ' . $msg, 500);
            }
        }

        $relPath = 'uploads/network/' . $tenantId . '/' . $safeId . '/logo/' . $fileName;
        $this->repo->updateColLogo($collabId, $relPath);

        Audit::log('UPLOAD_LOGO', 'network_collaborations', $collabId, null, ['logo_path' => $relPath]);
        Response::success(['logo_path' => $relPath], 201);
    }

    public function deleteCollaboration(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getCollaborationById($id);
        if (!$before) {
            Response::error('Collaborazione non trovata', 404);
        }
        $this->repo->deleteCollaboration($id);
        Audit::log('DELETE', 'network_collaborations', $id, $before, null);
        Response::success(['message' => 'Collaborazione eliminata']);
    }

    // ─── COLLABORATION DOCUMENTS ───────────────────────────────────────────────

    public function listColDocuments(): void
    {
        Auth::requireRole('operator');
        $collabId = filter_input(INPUT_GET, 'collaboration_id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($collabId)) {
            Response::error('collaboration_id obbligatorio', 400);
        }
        Response::success($this->repo->listColDocuments($collabId));
    }

    public function uploadColDocument(): void
    {
        Auth::requireRole('manager');

        $collabId = $_POST['collaboration_id'] ?? '';
        $docType = $_POST['doc_type'] ?? null;

        if (empty($collabId)) {
            Response::error('collaboration_id obbligatorio', 400);
        }

        $collab = $this->repo->getCollaborationById($collabId);
        if (!$collab) {
            Response::error('Collaborazione non trovata', 404);
        }

        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $_FILES['file']['error'] ?? -1;
            Response::error("Errore upload file (codice: {$errorCode})", 400);
        }

        $file = $_FILES['file'];

        if ($file['size'] > self::MAX_FILE_SIZE) {
            Response::error('File troppo grande (max 10 MB)', 400);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!in_array($mime, self::ALLOWED_MIMES, true)) {
            Response::error("Tipo file non consentito: {$mime}", 400);
        }

        $tenantId = TenantContext::id();
        $safeId = preg_replace('/[^A-Za-z0-9_]/', '', $collabId);
        $uploadDir = dirname(__DIR__, 3) . '/uploads/network/' . $tenantId . '/' . $safeId;
        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                Response::error('Impossibile creare la directory di upload del documento', 500);
            }
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        $destPath = $uploadDir . '/' . $fileName;

        if (!@move_uploaded_file($file['tmp_name'], $destPath)) {
            if (!@rename($file['tmp_name'], $destPath) && !@copy($file['tmp_name'], $destPath)) {
                $err = error_get_last();
                $msg = $err ? $err['message'] : 'Sconosciuto';
                Response::error('Errore nel salvataggio del file: ' . $msg, 500);
            }
        }

        $relPath = 'uploads/network/' . $tenantId . '/' . $safeId . '/' . $fileName;
        $docId = 'NCD_' . bin2hex(random_bytes(4));

        $this->repo->insertColDocument([
            ':id' => $docId,
            ':tenant_id' => $tenantId,
            ':collaboration_id' => $collabId,
            ':file_path' => $relPath,
            ':file_name' => $file['name'],
            ':doc_type' => $docType,
        ]);

        Audit::log('INSERT', 'network_documents', $docId, null, ['collaboration_id' => $collabId, 'file_name' => $file['name']]);
        Response::success(['id' => $docId, 'file_path' => $relPath], 201);
    }

    public function downloadColDocument(): void
    {
        Auth::requireRole('operator');
        $docId = filter_input(INPUT_GET, 'docId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($docId)) {
            Response::error('docId obbligatorio', 400);
        }
        $doc = $this->repo->getColDocumentById($docId);
        if (!$doc) {
            Response::error('Documento non trovato', 404);
        }
        $filePath = dirname(__DIR__, 3) . '/' . $doc['file_path'];
        if (!file_exists($filePath)) {
            Response::error('File non trovato sul server', 404);
        }
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($filePath);
        header('Content-Type: ' . $mime);
        header('Content-Disposition: inline; filename="' . basename($doc['file_name']) . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: private, max-age=3600');
        readfile($filePath);
        exit;
    }

    public function deleteColDocument(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $docId = $body['id'] ?? '';
        if (empty($docId)) {
            Response::error('id obbligatorio', 400);
        }
        $doc = $this->repo->getColDocumentById($docId);
        if (!$doc) {
            Response::error('Documento non trovato', 404);
        }
        $this->repo->deleteColDocument($docId);
        Audit::log('DELETE', 'network_documents', $docId, $doc, null);
        Response::success(['message' => 'Documento eliminato']);
    }

    // ─── TRIALS ───────────────────────────────────────────────────────────────

    public function listTrials(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listTrials());
    }

    public function createTrial(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_first_name', 'athlete_last_name']);

        $validStatuses = ['in_valutazione', 'approvato', 'non_idoneo', 'da_ricontattare'];
        $status = $body['status'] ?? 'in_valutazione';
        if (!in_array($status, $validStatuses, true)) {
            Response::error("Stato non valido: {$status}", 400);
        }

        $id = 'NTR_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => TenantContext::id(),
            ':athlete_first_name' => htmlspecialchars(trim($body['athlete_first_name']), ENT_QUOTES, 'UTF-8'),
            ':athlete_last_name' => htmlspecialchars(trim($body['athlete_last_name']), ENT_QUOTES, 'UTF-8'),
            ':birth_date' => $body['birth_date'] ?? null,
            ':nationality' => $body['nationality'] ?? null,
            ':position' => $body['position'] ?? null,
            ':origin_club' => $body['origin_club'] ?? null,
            ':trial_start' => $body['trial_start'] ?? null,
            ':trial_end' => $body['trial_end'] ?? null,
            ':status' => $status,
            ':notes' => $body['notes'] ?? null,
        ];

        $this->repo->createTrial($data);
        Audit::log('INSERT', 'network_trials', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateTrial(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'athlete_first_name', 'athlete_last_name']);

        $before = $this->repo->getTrialById($body['id']);
        if (!$before) {
            Response::error('Atleta in prova non trovato', 404);
        }

        $validStatuses = ['in_valutazione', 'approvato', 'non_idoneo', 'da_ricontattare'];
        $status = $body['status'] ?? 'in_valutazione';
        if (!in_array($status, $validStatuses, true)) {
            Response::error("Stato non valido: {$status}", 400);
        }

        $data = [
            ':athlete_first_name' => htmlspecialchars(trim($body['athlete_first_name']), ENT_QUOTES, 'UTF-8'),
            ':athlete_last_name' => htmlspecialchars(trim($body['athlete_last_name']), ENT_QUOTES, 'UTF-8'),
            ':birth_date' => $body['birth_date'] ?? null,
            ':nationality' => $body['nationality'] ?? null,
            ':position' => $body['position'] ?? null,
            ':origin_club' => $body['origin_club'] ?? null,
            ':trial_start' => $body['trial_start'] ?? null,
            ':trial_end' => $body['trial_end'] ?? null,
            ':status' => $status,
            ':notes' => $body['notes'] ?? null,
        ];

        $this->repo->updateTrial($body['id'], $data);
        Audit::log('UPDATE', 'network_trials', $body['id'], $before, $body);
        Response::success(['message' => 'Atleta in prova aggiornato']);
    }

    public function deleteTrial(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getTrialById($id);
        if (!$before) {
            Response::error('Atleta in prova non trovato', 404);
        }
        $this->repo->deleteTrial($id);
        Audit::log('DELETE', 'network_trials', $id, $before, null);
        Response::success(['message' => 'Atleta in prova rimosso']);
    }

    // ─── EVALUATIONS ──────────────────────────────────────────────────────────

    public function listEvaluations(): void
    {
        Auth::requireRole('operator');
        $trialId = filter_input(INPUT_GET, 'trial_id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($trialId)) {
            Response::error('trial_id obbligatorio', 400);
        }
        Response::success($this->repo->listEvaluations($trialId));
    }

    public function evaluateTrial(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['trial_id', 'eval_date']);

        $trial = $this->repo->getTrialById($body['trial_id']);
        if (!$trial) {
            Response::error('Atleta in prova non trovato', 404);
        }

        $clampScore = static function (mixed $v): int {
            $i = (int)($v ?? 5);
            return max(1, min(10, $i));
        };

        $user = Auth::user();
        $id = 'NEV_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => TenantContext::id(),
            ':trial_id' => $body['trial_id'],
            ':evaluator_user_id' => $user['id'] ?? null,
            ':eval_date' => $body['eval_date'],
            ':score_technical' => $clampScore($body['score_technical'] ?? null),
            ':score_tactical' => $clampScore($body['score_tactical'] ?? null),
            ':score_physical' => $clampScore($body['score_physical'] ?? null),
            ':score_mental' => $clampScore($body['score_mental'] ?? null),
            ':score_potential' => $clampScore($body['score_potential'] ?? null),
            ':notes' => $body['notes'] ?? null,
            ':video_url' => $body['video_url'] ?? null,
        ];

        $this->repo->insertEvaluation($data);
        Audit::log('INSERT', 'network_trial_evaluations', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    // ─── CONVERT TO SCOUTING ──────────────────────────────────────────────────

    public function convertToScouting(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $trialId = $body['trial_id'] ?? '';
        if (empty($trialId)) {
            Response::error('trial_id obbligatorio', 400);
        }

        $trial = $this->repo->getTrialById($trialId);
        if (!$trial) {
            Response::error('Atleta in prova non trovato', 404);
        }

        if (!empty($trial['scouting_profile_id'])) {
            Response::success(['scouting_profile_id' => $trial['scouting_profile_id'], 'message' => 'Già convertito in scouting']);
        }

        if (!$this->repo->scoutingTableExists()) {
            Response::error('Il modulo Scouting non è ancora attivo su questo sistema. Eseguire prima la migrazione relativa.', 503);
        }

        $scoutingId = 'SCT_' . bin2hex(random_bytes(4));
        $this->repo->insertScoutingProfile([
            ':id' => $scoutingId,
            ':tenant_id' => TenantContext::id(),
            ':first_name' => $trial['athlete_first_name'],
            ':last_name' => $trial['athlete_last_name'],
            ':birth_date' => $trial['birth_date'],
            ':nationality' => $trial['nationality'],
            ':position' => $trial['position'],
            ':origin_club' => $trial['origin_club'],
            ':notes' => 'Importato da Network Trials — ID: ' . $trialId,
        ]);

        $this->repo->setTrialScoutingProfile($trialId, $scoutingId);

        Audit::log('CONVERT', 'network_trials', $trialId, $trial, ['scouting_profile_id' => $scoutingId]);
        Response::success(['scouting_profile_id' => $scoutingId, 'message' => 'Atleta convertito in profilo Scouting']);
    }

    // ─── ACTIVITIES ───────────────────────────────────────────────────────────

    public function listActivities(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listActivities());
    }

    public function createActivity(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['title', 'date']);

        $id = 'NAC_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => TenantContext::id(),
            ':title' => htmlspecialchars(trim($body['title']), ENT_QUOTES, 'UTF-8'),
            ':activity_type' => $body['activity_type'] ?? null,
            ':date' => $body['date'],
            ':location' => $body['location'] ?? null,
            ':participants_json' => isset($body['participants']) ? json_encode($body['participants']) : null,
            ':outcome' => $body['outcome'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ];

        $this->repo->createActivity($data);
        Audit::log('INSERT', 'network_activities', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateActivity(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'title', 'date']);

        $before = $this->repo->getActivityById($body['id']);
        if (!$before) {
            Response::error('Attività non trovata', 404);
        }

        $data = [
            ':title' => htmlspecialchars(trim($body['title']), ENT_QUOTES, 'UTF-8'),
            ':activity_type' => $body['activity_type'] ?? null,
            ':date' => $body['date'],
            ':location' => $body['location'] ?? null,
            ':participants_json' => isset($body['participants']) ? json_encode($body['participants']) : null,
            ':outcome' => $body['outcome'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ];

        $this->repo->updateActivity($body['id'], $data);
        Audit::log('UPDATE', 'network_activities', $body['id'], $before, $body);
        Response::success(['message' => 'Attività aggiornata']);
    }

    public function deleteActivity(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getActivityById($id);
        if (!$before) {
            Response::error('Attività non trovata', 404);
        }
        $this->repo->deleteActivity($id);
        Audit::log('DELETE', 'network_activities', $id, $before, null);
        Response::success(['message' => 'Attività eliminata']);
    }

    // ─── HUB CONFIG ──────────────────────────────────────────────────────────

    public function getHubConfig(): void
    {
        Auth::requireRole('operator'); // basic access
        Response::success($this->repo->getHubConfig());
    }

    public function updateHubText(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        // text can be empty, but should exist in payload
        if (!array_key_exists('text', $body)) {
            Response::error('text field is required', 400);
        }
        
        $text = trim($body['text']);
        $this->repo->updateHubText($text);
        Audit::log('UPDATE_HUB_TEXT', 'tenant_settings', 'network_hub_text', null, ['text' => $text]);
        Response::success(['message' => 'HUB text updated']);
    }

    public function uploadHubLogo(): void
    {
        Auth::requireRole('manager');

        if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $_FILES['logo']['error'] ?? -1;
            Response::error("Errore upload logo (codice: {$errorCode})", 400);
        }

        $file = $_FILES['logo'];

        if ($file['size'] > self::MAX_FILE_SIZE) {
            Response::error('File troppo grande (max 10 MB)', 400);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!in_array($mime, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'], true)) {
            Response::error('Tipo file non consentito. Accettati: JPG, PNG, WEBP, SVG', 400);
        }

        $tenantId = TenantContext::id();
        $uploadDir = dirname(__DIR__, 3) . '/uploads/network/' . $tenantId . '/hub';
        if (!is_dir($uploadDir)) {
            if (!@mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
                Response::error('Impossibile creare la directory di upload', 500);
            }
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'hub_logo_' . date('Ymd_His') . '.' . $ext;
        $destPath = $uploadDir . '/' . $fileName;

        if (!@move_uploaded_file($file['tmp_name'], $destPath)) {
            if (!@rename($file['tmp_name'], $destPath) && !@copy($file['tmp_name'], $destPath)) {
                $err = error_get_last();
                $msg = $err ? $err['message'] : 'Sconosciuto';
                Response::error('Errore nel salvataggio del logo: ' . $msg, 500);
            }
        }

        $relPath = 'uploads/network/' . $tenantId . '/hub/' . $fileName;
        $this->repo->updateHubLogo($relPath);

        Audit::log('UPLOAD_HUB_LOGO', 'tenant_settings', 'network_hub_logo', null, ['logo_path' => $relPath]);
        Response::success(['logo_path' => $relPath], 201);
    }

    // ─── PUBLIC ENDPOINTS FOR WEBSITE ──────────────────────────────────────────────

    public function getPublicCollaborations(): void
    {
        // Nessun controllo Auth, endpoint pubblico
        Response::success($this->repo->listCollaborations());
    }
}