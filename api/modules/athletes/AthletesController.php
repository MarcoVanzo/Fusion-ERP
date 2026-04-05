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
    private AthletesService $service;

    public function __construct()
    {
        $this->repo = new AthletesRepository();
        $this->service = new AthletesService();
    }

    /**
     * Helper to handle service calls with standard error handling.
     */
    private function handleServiceCall(callable $callback): void
    {
        try {
            $result = $callback();
            Response::success($result);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $httpCode);
        }
    }

    // ─── GET /api/?module=athletes&action=list ────────────────────────────────
    public function list(): void
    {
        Auth::requireRead('athletes');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_DEFAULT) ?? '';
        Response::success($this->repo->listAthletes($teamId));
    }

    // ─── GET /api/?module=athletes&action=listLight ───────────────────────────
    public function listLight(): void
    {
        Auth::requireRead('athletes');
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_DEFAULT) ?? '';
        Response::success($this->repo->listAthletesLight($teamId));
    }


    // ─── GET /api/?module=athletes&action=get&id=ATH_xxx ─────────────────────
    public function get(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        $this->handleServiceCall(fn() => $this->service->getProfile($id));
    }

    // ─── GET /api/?module=athletes&action=myProfile ───────────────────────────
    public function myProfile(): void
    {
        $user = Auth::requireAuth();
        $this->handleServiceCall(fn() => $this->service->getMyProfile($user));
    }

    // ─── POST /api/?module=athletes&action=create ─────────────────────────────
    public function create(): void
    {
        Auth::requireWrite('athletes');
        $body = Response::jsonBody();
        $this->handleServiceCall(fn() => $this->service->createAthlete($body));
    }

    // ─── POST /api/?module=athletes&action=update ─────────────────────────────
    public function update(): void
    {
        Auth::requireWrite('athletes');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'first_name', 'last_name']);

        $before = $this->repo->getAthleteById($body['id']);
        if (!$before) {
            Response::error('Atleta non trovato', 404);
        }

        // Support multi-team: team_season_ids (array) takes priority over legacy team_id
        if (isset($body['team_season_ids']) && is_array($body['team_season_ids'])) {
            $teamSeasonIds = array_values(array_filter($body['team_season_ids']));
        }
        elseif (!empty($body['team_season_id'])) {
            $teamSeasonIds = [$body['team_season_id']];
        }
        else {
            $teamSeasonIds = $before['team_season_ids'] ?? (isset($before['team_ids']) ? $before['team_ids'] : []);
        }
        $primaryTeamSeasonId = $teamSeasonIds[0] ?? null;

        $primaryTeamId = null;
        if ($primaryTeamSeasonId) {
            $primaryTeamId = $this->repo->getTeamIdForSeason($primaryTeamSeasonId) ?? $before['team_id'];
        } else {
            $primaryTeamId = $before['team_id'] ?? null;
        }

        $val = fn($k) => array_key_exists($k, $body) ? $body[$k] : ($before[$k] ?? null);

        $this->repo->updateAthlete($body['id'], [
            ':first_name'              => trim($body['first_name']),
            ':last_name'               => trim($body['last_name']),
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
            ':parent_contact'          => $val('parent_contact'),
            ':parent_phone'            => $val('parent_phone'),
            ':nationality'             => $val('nationality'),
            ':blood_group'             => $val('blood_group'),
            ':allergies'               => $val('allergies'),
            ':medications'             => $val('medications'),
            ':emergency_contact_name'  => $val('emergency_contact_name'),
            ':emergency_contact_phone' => $val('emergency_contact_phone'),
            ':communication_preference' => $val('communication_preference'),
            ':image_release_consent'   => isset($body['image_release_consent']) ? (int)$body['image_release_consent'] : 0,
            ':medical_cert_issued_at'  => $val('medical_cert_issued_at'),
            ':team_id' => $primaryTeamId,
        ]);

        $this->repo->setAthleteTeams($body['id'], $teamSeasonIds, $primaryTeamId);

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

    // ─── POST /api/?module=athletes&action=uploadPhoto ────────────────────────
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
            'image/png'  => 'png',
            'image/webp' => 'webp',
        };

        $uploadDir = __DIR__ . '/../../../uploads/athlete_photos/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

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


    // ─── DOCUMENT FILE UPLOADS ────────────────────────────────────────────────
    private function uploadAthleteDocument(string $dbField): void
    {
        Auth::requireWrite('athletes');
        $id = filter_input(INPUT_POST, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) {
            Response::error('ID atleta mancante', 400);
        }

        $athlete = $this->repo->getAthleteById($id);
        if (!$athlete) {
            Response::error('Atleta non trovato', 404);
        }

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('File non caricato o errore upload', 400);
        }

        $file = $_FILES['file'];
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);

        $allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($mimeType, $allowedMimes, true)) {
            Response::error('Formato non supportato (solo PDF, JPG, PNG, WEBP)', 415);
        }

        $storagePath = dirname(__DIR__, 3) . '/storage/docs/athletes/';
        if (!is_dir($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $safeFilename = 'athlete_' . $id . '_' . $dbField . '_' . time() . '.' . $ext;
        $fullPath = $storagePath . $safeFilename;

        if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
            Response::error('Errore salvataggio documento', 500);
        }

        $relPath = 'storage/docs/athletes/' . $safeFilename;

        $oldPath = $athlete[$dbField] ?? null;
        if ($oldPath) {
            $oldFullPath = dirname(__DIR__, 3) . '/' . $oldPath;
            if (file_exists($oldFullPath)) {
                @unlink($oldFullPath);
            }
        }

        $this->repo->updateDocumentPath($id, $dbField, $relPath);
        Audit::log('UPDATE', 'athletes', $id, null, [$dbField => $relPath]);
        Response::success(['path' => $relPath, 'filename' => basename($relPath)]);
    }

    public function uploadContractFile(): void { $this->uploadAthleteDocument('contract_file_path'); }
    public function uploadIdDocFront(): void { $this->uploadAthleteDocument('id_doc_front_file_path'); }
    public function uploadIdDocBack(): void { $this->uploadAthleteDocument('id_doc_back_file_path'); }
    public function uploadCfDocFront(): void { $this->uploadAthleteDocument('cf_doc_front_file_path'); }
    public function uploadCfDocBack(): void { $this->uploadAthleteDocument('cf_doc_back_file_path'); }
    public function uploadMedicalCert(): void { $this->uploadAthleteDocument('medical_cert_file_path'); }

    /** Serve an athlete document file for inline display / download */
    public function downloadDoc(): void
    {
        Auth::requireRead('athletes');
        $id    = filter_input(INPUT_GET, 'id',    FILTER_DEFAULT) ?? '';
        $field = filter_input(INPUT_GET, 'field',  FILTER_DEFAULT) ?? '';

        $allowed = ['contract_file_path', 'id_doc_front_file_path', 'id_doc_back_file_path', 'cf_doc_front_file_path', 'cf_doc_back_file_path', 'medical_cert_file_path'];
        if (empty($id) || !in_array($field, $allowed, true)) {
            Response::error('Parametri non validi', 400);
        }

        $athlete = $this->repo->getAthleteById($id);
        if (!$athlete || empty($athlete[$field])) {
            Response::error('Documento non trovato', 404);
        }

        $fullPath = dirname(__DIR__, 3) . '/' . $athlete[$field];
        if (!file_exists($fullPath)) {
            Response::error('File fisico non trovato sul server', 404);
        }

        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($fullPath);
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: inline; filename="' . basename($fullPath) . '"');
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        exit;
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

        $this->repo->insertMetric([
            ':id' => $metricId,
            ':athlete_id' => $athleteId,
            ':event_id' => $body['event_id'] ?? null,
            ':log_date' => $body['log_date'],
            ':duration_min' => $durationMin,
            ':rpe' => $rpe,
            ':load_value' => $loadValue,
            ':acwr_score' => 0.0,
            ':notes' => $body['notes'] ?? null,
        ]);

        $acwr = $this->service->calculateACWR($athleteId);
        $this->repo->updateMetricAcwr($metricId, $acwr['score']);

        if ($acwr['risk'] === 'high' || $acwr['risk'] === 'extreme') {
            $this->repo->insertAcwrAlert($athleteId, $acwr['score'], $acwr['risk']);
            Audit::log('ACWR_ALERT', 'acwr_alerts', $athleteId, null, $acwr);
        }

        Audit::log('INSERT', 'metrics_logs', $metricId, null, $body);
        Response::success(['id' => $metricId, 'acwr' => $acwr], 201);
    }

    // ─── GET /api/?module=athletes&action=acwr&id=ATH_xxx ────────────────────
    public function acwr(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        $this->handleServiceCall(fn() => $this->service->calculateACWR($id));
    }

    // ─── POST /api/?module=athletes&action=aiReport ───────────────────────────
    public function aiReport(): void
    {
        Auth::requireWrite('athletes');

        if (isset($_SESSION['last_ai_report']) && (time() - $_SESSION['last_ai_report']) < 10) {
            Response::error('Troppe richieste AI in coda. Attendi qualche secondo.', 429);
        }
        $_SESSION['last_ai_report'] = time();

        $body = Response::jsonBody();
        $athleteId = $body['athlete_id'] ?? '';
        $this->handleServiceCall(fn() => $this->service->generateAIReport($athleteId));
    }

    // ─── GET /api/?module=athletes&action=aiSummary&id=ATH_xxx ───────────────
    public function aiSummary(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        Response::success($this->repo->getLatestAiSummary($id));
    }

    // ─── GET /api/?module=athletes&action=activityLog&id=ATH_xxx ─────────────
    public function activityLog(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        Response::success($this->repo->getActivityLog($id));
    }

    // ─── GET /api/?module=athletes&action=alerts ──────────────────────────────
    public function alerts(): void
    {
        Auth::requireRole('social media manager');
        $tenantId = \FusionERP\Shared\TenantContext::id();
        Response::success($this->repo->getUnacknowledgedAlerts($tenantId));
    }

    // ─── GET /api/?module=athletes&action=teams ───────────────────────────────
    public function teams(): void
    {
        Auth::requireRead('athletes');
        Response::success($this->repo->listTeams());
    }

    // ─── PUBLIC ENDPOINTS ───────────────────────────────────────────────────
    public function getPublicTeams(): void
    {
        // Public endpoint allowed by router.php whitelist
        Response::success($this->repo->listTeams());
    }

    public function getPublicTeamAthletes(): void
    {
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_DEFAULT) ?? '';
        Response::success($this->repo->listPublicAthletes($teamId));
    }
}
 	