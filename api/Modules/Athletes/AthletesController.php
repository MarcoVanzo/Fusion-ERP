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
use FusionERP\Modules\Auth\AuthRepository;

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
        } catch (\Throwable $t) {
            error_log("[AthletesController] " . $t->getMessage());
            $code = $t->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error("TECHNICAL_ERROR_CONTROLLER: " . $t->getMessage(), $httpCode);
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
        error_log("[Athletes::listLight] teamId='{$teamId}' | TenantID=" . \FusionERP\Shared\TenantContext::id());
        $data = $this->repo->listAthletesLight($teamId);
        error_log("[Athletes::listLight] Returned " . count($data) . " athletes");
        Response::success($data);
    }


    // ─── GET /api/?module=athletes&action=get&id=ATH_xxx ─────────────────────
    public function get(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        error_log("[Athletes::get] Requested ID: '{$id}' | TenantID: " . \FusionERP\Shared\TenantContext::id());
        $this->handleServiceCall(fn() => $this->service->getProfile($id));
    }

    // ─── GET /api/?module=athletes&action=getByUserId ─────────────────────
    public function getByUserId(): void
    {
        $user = Auth::requireAuth();
        $userId = filter_input(INPUT_GET, 'user_id', FILTER_DEFAULT) ?? '';
        if (empty($userId)) Response::error('user_id mancante', 400);

        // Security check
        if ($user['role'] !== 'admin' && $user['id'] !== $userId) {
            // Check if the current user is a sub-user of the requested $userId
            if (empty($user['parent_user_id']) || $user['parent_user_id'] !== $userId) {
                Response::error('Accesso negato al profilo', 403);
            }
        }

        $this->handleServiceCall(fn() => $this->service->getByUserId($userId));
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
        $user = Auth::requireAuth();
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);

        $athleteId = $body['id'];
        $before = $this->repo->getAthleteById($athleteId);
        if (!$before) {
            Response::error('Atleta non trovato', 404);
        }

        // ROLE-BASED ACCESS CONTROL
        if ($user['role'] === 'atleta') {
            // Athletes can only update their own profile OR their parent's profile (if sub-user)
            $isOwner = $before['user_id'] === $user['id'];
            $isSubUser = !empty($user['parent_user_id']) && $before['user_id'] === $user['parent_user_id'];

            if (!$isOwner && !$isSubUser) {
                Response::error('Non hai i permessi per modificare questo profilo.', 403);
            }
            // Restricted update via service
            $this->handleServiceCall(fn() => $this->service->updateAthleteBasic($athleteId, $body));
            return;
        }

        // STAFF/ADMIN ACCESS
        Auth::requireWrite('athletes');
        
        try {
            // Support multi-team: team_season_ids (array) takes priority over legacy team_id
            if (isset($body['team_season_ids']) && is_array($body['team_season_ids'])) {
                $teamSeasonIds = array_values(array_filter($body['team_season_ids']));
            } elseif (!empty($body['team_season_id'])) {
                $teamSeasonIds = [$body['team_season_id']];
            } else {
                $teamSeasonIds = $before['team_ids'] ?? [];
            }

            $primaryTeamId = null;
            if (!empty($teamSeasonIds)) {
                $primaryTeamId = $this->repo->getTeamIdForSeason($teamSeasonIds[0]) ?: ($before['team_id'] ?? null);
            } else {
                $primaryTeamId = $before['team_id'] ?? null;
            }

            $updateData = [];

            // 1. Core Fields (only for staff/admin)
            if (isset($body['first_name'])) $updateData[':first_name'] = trim($body['first_name']);
            if (isset($body['last_name']))  $updateData[':last_name']  = trim($body['last_name']);
            if ($primaryTeamId)             $updateData[':team_id']    = $primaryTeamId;
            if (isset($body['is_active']))  $updateData[':is_active']  = (int)$body['is_active'];

            // 2. Optional Registry Fields
            $optionalFields = [
                'jersey_number', 'role', 'birth_date', 'birth_place', 'height_cm', 'weight_kg',
                'residence_address', 'residence_city', 'phone', 'email', 'identity_document', 'fiscal_code',
                'medical_cert_type', 'medical_cert_expires_at', 'medical_cert_issued_at',
                'federal_id', 'shirt_size', 'shoe_size', 'parent_contact', 'parent_phone',
                'nationality', 'blood_group', 'allergies', 'medications',
                'emergency_contact_name', 'emergency_contact_phone',
                'communication_preference', 'image_release_consent', 'vald_profile_id',
                'photo_release_file_path', 'privacy_policy_file_path',
                'guesthouse_rules_file_path', 'guesthouse_delegate_file_path', 'health_card_file_path',
                'quota_iscrizione_rata1', 'quota_iscrizione_rata2',
                'quota_vestiario', 'quota_foresteria', 'quota_trasporti',
                'quota_iscrizione_rata1_paid', 'quota_iscrizione_rata2_paid',
                'quota_vestiario_paid', 'quota_foresteria_paid', 'quota_trasporti_paid',
                'quota_payment_deadline'
            ];

            foreach ($optionalFields as $field) {
                if (array_key_exists($field, $body)) {
                    $value = $body[$field];
                    
                    // DATA SANITIZATION:
                    // Convert empty strings to NULL for numeric and date fields to avoid "Incorrect integer value" or invalid date errors in MySQL strict mode.
                    $numericFields = ['height_cm', 'weight_kg', 'jersey_number'];
                    $dateFields = ['birth_date', 'medical_cert_expires_at', 'medical_cert_issued_at', 'quota_payment_deadline'];
                    
                    if ($value === '' && (in_array($field, $numericFields) || in_array($field, $dateFields))) {
                        $value = null;
                    }
                    
                    // --- EMAIL VALIDATION & SYNC ---
                    if ($field === 'email' && !empty($value) && $value !== ($before['email'] ?? '')) {
                        $authRepo = new AuthRepository();
                        $existingUser = $authRepo->getUserByEmail($value);
                        if ($existingUser && $existingUser['id'] !== ($before['user_id'] ?? null)) {
                            throw new \Exception("L'email '{$value}' è già associata a un altro account nel sistema.", 400);
                        }
                    }
                    
                    $updateData[":$field"] = $value;
                }
            }

            if (empty($updateData)) {
                Response::success(['message' => 'Nessuna modifica rilevata']);
            }

            // DB Update
            $this->repo->updateAthlete($athleteId, $updateData);

            // --- SYNC EMAIL TO USER TABLE ---
            if (isset($updateData[':email']) && !empty($before['user_id'])) {
                $authRepo = new AuthRepository();
                $authRepo->updateUserEmail($before['user_id'], $updateData[':email']);
            }

            // Team seasons sync
            $this->repo->setAthleteTeams($athleteId, $teamSeasonIds, $primaryTeamId);

            Audit::log('UPDATE', 'athletes', $athleteId, $before, $updateData);
            Response::success(['message' => 'Profilo aggiornato correttamente']);

        } catch (\PDOException $e) {
            error_log("[AthletesController] SQL Error: " . $e->getMessage());
            if ($e->getCode() === '23000') {
                Response::error("Errore di integrità: l'email o un altro campo univoco è già presente nel sistema.", 400);
            }
            Response::error("Errore database durante l'aggiornamento.", 500);
        } catch (\Throwable $e) {
            error_log("[AthletesController] Error: " . $e->getMessage());
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $httpCode);
        }
    }

    // ─── POST /api/?module=athletes&action=generateUser ───────────────────────
    public function generateUser(): void
    {
        Auth::requireWrite('athletes');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('ID atleta obbligatorio', 400);
        }
        $this->handleServiceCall(fn() => $this->service->generateAthleteUser($id));
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
    public function uploadPhotoRelease(): void { $this->uploadAthleteDocument('photo_release_file_path'); }
    public function uploadPrivacyPolicy(): void { $this->uploadAthleteDocument('privacy_policy_file_path'); }
    public function uploadGuesthouseRules(): void { $this->uploadAthleteDocument('guesthouse_rules_file_path'); }
    public function uploadGuesthouseDelegate(): void { $this->uploadAthleteDocument('guesthouse_delegate_file_path'); }
    public function uploadHealthCard(): void { $this->uploadAthleteDocument('health_card_file_path'); }

    /** Serve an athlete document file for inline display / download */
    public function downloadDoc(): void
    {
        Auth::requireRead('athletes');
        $id    = filter_input(INPUT_GET, 'id',    FILTER_DEFAULT) ?? '';
        $field = filter_input(INPUT_GET, 'field',  FILTER_DEFAULT) ?? '';

        $allowed = ['contract_file_path', 'id_doc_front_file_path', 'id_doc_back_file_path',
                    'cf_doc_front_file_path', 'cf_doc_back_file_path', 'medical_cert_file_path',
                    'photo_release_file_path', 'privacy_policy_file_path',
                    'guesthouse_rules_file_path', 'guesthouse_delegate_file_path', 'health_card_file_path'];
        if (empty($id) || !in_array($field, $allowed, true)) {
            error_log("[downloadDoc] Parametri non validi. id={$id}, field={$field}");
            Response::error('Parametri non validi', 400);
        }

        $athlete = $this->repo->getAthleteById($id);
        if (!$athlete || empty($athlete[$field])) {
            error_log("[downloadDoc] Documento non trovato nel db. id={$id}, field={$field}, db_value=" . ($athlete[$field] ?? 'null'));
            Response::error('Documento non trovato', 404);
        }

        $fullPath = dirname(__DIR__, 3) . '/' . $athlete[$field];
        if (!file_exists($fullPath)) {
            // Fallback per file caricati con il vecchio bug dell'UPLOAD_STORAGE_PATH
            $fallbackPath = rtrim(getenv('UPLOAD_STORAGE_PATH') ?: '', '/') . '/' . basename($athlete[$field]);
            if (!empty($fallbackPath) && file_exists($fallbackPath)) {
                $fullPath = $fallbackPath;
            } else {
                error_log("[downloadDoc] File fisico non trovato. path={$fullPath}, fallback={$fallbackPath}");
                Response::error('File fisico non trovato sul server', 404);
            }
        }

        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($fullPath);
        
        // Svuotiamo il buffer per evitare che eventuali spazi/newline corrompano il file
        if (ob_get_level() > 0) {
            ob_end_clean();
        }

        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: inline; filename="' . basename($fullPath) . '"');
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        exit;
    }


    /** TEMP DEBUG — rimuovere dopo fix */
    public function debugDoc(): void
    {
        Auth::requireRead('athletes');
        $db = \FusionERP\Shared\Database::getInstance();
        $stmt = $db->prepare("SELECT id, full_name, 
            medical_cert_file_path, contract_file_path, 
            id_doc_front_file_path, id_doc_back_file_path,
            cf_doc_front_file_path, cf_doc_back_file_path,
            photo_release_file_path, privacy_policy_file_path,
            guesthouse_rules_file_path, guesthouse_delegate_file_path,
            health_card_file_path
            FROM athletes WHERE full_name LIKE :name LIMIT 5");
        $stmt->execute([':name' => '%Favaretto%']);
        $athletes = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $result = [
            'athletes_found' => count($athletes),
            'server_paths' => [
                'dirname2' => dirname(__DIR__, 2),
                'dirname3' => dirname(__DIR__, 3),
                'cwd' => getcwd(),
                'upload_env' => getenv('UPLOAD_STORAGE_PATH') ?: 'NOT SET',
            ],
            'athletes' => [],
            'dirs' => [],
        ];

        $docFields = ['medical_cert_file_path','contract_file_path','id_doc_front_file_path',
            'id_doc_back_file_path','cf_doc_front_file_path','cf_doc_back_file_path',
            'photo_release_file_path','privacy_policy_file_path','guesthouse_rules_file_path',
            'guesthouse_delegate_file_path','health_card_file_path'];

        foreach ($athletes as $a) {
            $ad = ['id' => $a['id'], 'name' => $a['full_name'], 'docs' => []];
            foreach ($docFields as $f) {
                if (empty($a[$f])) continue;
                $p3 = dirname(__DIR__, 3) . '/' . $a[$f];
                $p2 = dirname(__DIR__, 2) . '/' . $a[$f];
                $fb = rtrim(getenv('UPLOAD_STORAGE_PATH') ?: '', '/') . '/' . basename($a[$f]);
                $ad['docs'][$f] = [
                    'db' => $a[$f],
                    'path3_exists' => file_exists($p3),
                    'path3' => $p3,
                    'path2_exists' => file_exists($p2),
                    'path2' => $p2,
                    'fallback_exists' => file_exists($fb),
                    'fallback' => $fb,
                ];
            }
            $result['athletes'][] = $ad;
        }

        // Lista directory
        foreach ([
            dirname(__DIR__, 3) . '/storage/docs/athletes',
            dirname(__DIR__, 2) . '/storage/docs/athletes',
            dirname(__DIR__, 3) . '/storage/uploads',
            dirname(__DIR__, 2) . '/storage/uploads',
        ] as $dir) {
            if (is_dir($dir)) {
                $result['dirs'][$dir] = array_diff(scandir($dir), ['.', '..']);
            } else {
                $result['dirs'][$dir] = 'NOT_FOUND';
            }
        }

        Response::success($result);
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

    // ─── GET /api/?module=athletes&action=getTransportHistory&id=ATH_xxx ─────
    public function getTransportHistory(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        Response::success($this->repo->getTransportHistory($id));
    }

    // ─── GET /api/?module=athletes&action=getTournamentHistory&id=ATH_xxx ────
    public function getTournamentHistory(): void
    {
        Auth::requireRead('athletes');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        Response::success($this->repo->getTournamentHistory($id));
    }

    // ─── POST /api/?module=athletes&action=setTournamentPayment ──────────────
    public function setTournamentPayment(): void
    {
        Auth::requireWrite('athletes');
        $body = json_decode(file_get_contents('php://input'), true);
        if (!$body || empty($body['athlete_id']) || empty($body['event_id'])) {
            Response::error('Dati mancanti', 400);
        }
        $athleteId = $body['athlete_id'];
        $eventId = $body['event_id'];
        $hasPaid = !empty($body['has_paid']);
        $this->repo->setTournamentPayment($athleteId, $eventId, $hasPaid);
        Response::success(['message' => 'Pagamento torneo aggiornato']);
    }

    // ─── GET /api/?module=athletes&action=alerts ──────────────────────────────
    public function alerts(): void
    {
        Auth::requireRole('allenatore');
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
 	