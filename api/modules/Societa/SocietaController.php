<?php
/**
 * Societa Controller — CRUD for societa_* tables
 * Fusion ERP v1.0
 *
 * Endpoints (all via ?module=societa&action=…):
 *   getProfile / saveProfile
 *   listRoles / createRole / updateRole / deleteRole
 *   listMembers / createMember / updateMember / deleteMember
 *   listDocuments / uploadDocument / downloadDocument / deleteDocument
 *   listDeadlines / createDeadline / updateDeadline / deleteDeadline
 *   listSponsors / createSponsor / updateSponsor / uploadSponsorLogo / deleteSponsor
 *   listTitoli / createTitolo / updateTitolo / deleteTitolo
 */

declare(strict_types=1);

namespace FusionERP\Modules\Societa;

$_societaShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_societaShared . 'Auth.php';
require_once $_societaShared . 'Audit.php';
require_once $_societaShared . 'Response.php';
require_once $_societaShared . 'TenantContext.php';
unset($_societaShared);
require_once __DIR__ . '/SocietaRepository.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class SocietaController
{
    private SocietaRepository $repo;

    /** Max upload size: 10 MB */
    private const MAX_FILE_SIZE = 10 * 1024 * 1024;

    /** Allowed MIME types for document upload */
    private const ALLOWED_MIMES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
    ];

    public function __construct()
    {
        $this->repo = new SocietaRepository();
    }

    // ─── PROFILE ──────────────────────────────────────────────────────────────

    public function getProfile(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->getProfile());
    }

    public function saveProfile(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();

        $data = [
            ':mission' => $body['mission'] ?? null,
            ':vision' => $body['vision'] ?? null,
            ':values' => $body['values'] ?? null,
            ':founded_year' => isset($body['founded_year']) ? (int)$body['founded_year'] : null,
            ':primary_color' => $body['primary_color'] ?? null,
            ':secondary_color' => $body['secondary_color'] ?? null,
            ':logo_path' => $body['logo_path'] ?? null,
            ':legal_address' => $body['legal_address'] ?? null,
            ':operative_address' => $body['operative_address'] ?? null,
        ];

        $this->repo->upsertProfile($data);
        Audit::log('UPSERT', 'societa_profile', TenantContext::id(), null, $body);
        Response::success(['message' => 'Profilo società salvato']);
    }

    // ─── LOGO UPLOAD ──────────────────────────────────────────────────────────

    public function uploadLogo(): void
    {
        Auth::requireRole('manager');

        if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            Response::error('Errore upload logo', 400);
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
        $uploadDir = dirname(__DIR__, 3) . '/uploads/societa/' . $tenantId;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'logo_' . date('Ymd_His') . '.' . $ext;
        $destPath = $uploadDir . '/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Errore nel salvataggio del logo', 500);
        }

        $relPath = 'uploads/societa/' . $tenantId . '/' . $fileName;
        Response::success(['logo_path' => $relPath], 201);
    }

    // ─── ROLES ────────────────────────────────────────────────────────────────

    public function listRoles(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listRoles());
    }

    public function createRole(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name']);

        $id = 'SRL_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => TenantContext::id(),
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':description' => $body['description'] ?? null,
            ':permissions_json' => isset($body['permissions_json']) ? json_encode($body['permissions_json']) : null,
            ':parent_role_id' => $body['parent_role_id'] ?? null,
            ':sort_order' => (int)($body['sort_order'] ?? 0),
        ];

        $this->repo->createRole($data);
        Audit::log('INSERT', 'societa_roles', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateRole(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'name']);

        $before = $this->repo->getRoleById($body['id']);
        if (!$before) {
            Response::error('Ruolo non trovato', 404);
        }

        $data = [
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':description' => $body['description'] ?? null,
            ':permissions_json' => isset($body['permissions_json']) ? json_encode($body['permissions_json']) : null,
            ':parent_role_id' => $body['parent_role_id'] ?? null,
            ':sort_order' => (int)($body['sort_order'] ?? 0),
        ];

        $this->repo->updateRole($body['id'], $data);
        Audit::log('UPDATE', 'societa_roles', $body['id'], $before, $body);
        Response::success(['message' => 'Ruolo aggiornato']);
    }

    public function deleteRole(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);

        $before = $this->repo->getRoleById($body['id']);
        if (!$before) {
            Response::error('Ruolo non trovato', 404);
        }

        $this->repo->deleteRole($body['id']);
        Audit::log('DELETE', 'societa_roles', $body['id'], $before, null);
        Response::success(['message' => 'Ruolo eliminato']);
    }

    // ─── MEMBERS ──────────────────────────────────────────────────────────────

    public function listMembers(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listMembers());
    }

    public function createMember(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['full_name', 'role_id']);

        $id = 'SMB_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => TenantContext::id(),
            ':user_id' => $body['user_id'] ?? null,
            ':role_id' => $body['role_id'],
            ':full_name' => htmlspecialchars(trim($body['full_name']), ENT_QUOTES, 'UTF-8'),
            ':email' => $body['email'] ?? null,
            ':phone' => $body['phone'] ?? null,
            ':start_date' => $body['start_date'] ?? null,
            ':end_date' => $body['end_date'] ?? null,
            ':is_active' => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
            ':notes' => $body['notes'] ?? null,
        ];

        $this->repo->createMember($data);
        Audit::log('INSERT', 'societa_members', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateMember(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'full_name', 'role_id']);

        $before = $this->repo->getMemberById($body['id']);
        if (!$before) {
            Response::error('Membro non trovato', 404);
        }

        $data = [
            ':user_id' => $body['user_id'] ?? null,
            ':role_id' => $body['role_id'],
            ':full_name' => htmlspecialchars(trim($body['full_name']), ENT_QUOTES, 'UTF-8'),
            ':email' => $body['email'] ?? null,
            ':phone' => $body['phone'] ?? null,
            ':start_date' => $body['start_date'] ?? null,
            ':end_date' => $body['end_date'] ?? null,
            ':is_active' => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
            ':notes' => $body['notes'] ?? null,
        ];

        $this->repo->updateMember($body['id'], $data);
        Audit::log('UPDATE', 'societa_members', $body['id'], $before, $body);
        Response::success(['message' => 'Membro aggiornato']);
    }

    public function deleteMember(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getMemberById($id);
        if (!$before) {
            Response::error('Membro non trovato', 404);
        }
        $this->repo->deleteMember($id);
        Audit::log('DELETE', 'societa_members', $id, $before, null);
        Response::success(['message' => 'Membro rimosso']);
    }

    // ─── DOCUMENTS ────────────────────────────────────────────────────────────

    public function listDocuments(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listDocuments());
    }

    public function uploadDocument(): void
    {
        Auth::requireRole('manager');

        $category = $_POST['category'] ?? 'altro';
        $expiryDate = $_POST['expiry_date'] ?? null;
        $notes = $_POST['notes'] ?? null;

        $validCategories = ['statuto', 'affiliazione', 'licenza', 'assicurazione', 'altro'];
        if (!in_array($category, $validCategories, true)) {
            Response::error("Categoria non valida: {$category}", 400);
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
            Response::error("Tipo file non consentito: {$mime}. Accettati: PDF, DOC, DOCX, JPG, PNG, WEBP", 400);
        }

        $tenantId = TenantContext::id();
        $uploadDir = dirname(__DIR__, 3) . '/uploads/societa/' . $tenantId . '/docs';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = $category . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        $destPath = $uploadDir . '/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Errore nel salvataggio del file', 500);
        }

        $relPath = 'uploads/societa/' . $tenantId . '/docs/' . $fileName;
        $docId = 'SDC_' . bin2hex(random_bytes(4));

        $this->repo->insertDocument([
            ':id' => $docId,
            ':tenant_id' => $tenantId,
            ':category' => $category,
            ':file_path' => $relPath,
            ':file_name' => $file['name'],
            ':expiry_date' => $expiryDate ?: null,
            ':notes' => $notes,
        ]);

        Audit::log('INSERT', 'societa_documents', $docId, null, [
            'category' => $category,
            'file_name' => $file['name'],
        ]);

        Response::success(['id' => $docId, 'file_path' => $relPath], 201);
    }

    public function downloadDocument(): void
    {
        Auth::requireRole('operator');
        $docId = filter_input(INPUT_GET, 'docId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($docId)) {
            Response::error('docId obbligatorio', 400);
        }

        $doc = $this->repo->getDocumentById($docId);
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

    public function deleteDocument(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $docId = $body['id'] ?? '';
        if (empty($docId)) {
            Response::error('id obbligatorio', 400);
        }
        $doc = $this->repo->getDocumentById($docId);
        if (!$doc) {
            Response::error('Documento non trovato', 404);
        }
        $this->repo->deleteDocument($docId);
        Audit::log('DELETE', 'societa_documents', $docId, $doc, null);
        Response::success(['message' => 'Documento eliminato']);
    }

    // ─── DEADLINES ────────────────────────────────────────────────────────────

    public function listDeadlines(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listDeadlines());
    }

    public function createDeadline(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['title', 'due_date']);

        $validStatuses = ['aperto', 'completato', 'scaduto', 'annullato'];
        $status = $body['status'] ?? 'aperto';
        if (!in_array($status, $validStatuses, true)) {
            Response::error("Stato non valido: {$status}", 400);
        }

        $id = 'SDL_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => TenantContext::id(),
            ':title' => htmlspecialchars(trim($body['title']), ENT_QUOTES, 'UTF-8'),
            ':due_date' => $body['due_date'],
            ':category' => $body['category'] ?? null,
            ':status' => $status,
            ':linked_document_id' => $body['linked_document_id'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ];

        $this->repo->createDeadline($data);
        Audit::log('INSERT', 'societa_deadlines', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateDeadline(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'title', 'due_date']);

        $before = $this->repo->getDeadlineById($body['id']);
        if (!$before) {
            Response::error('Scadenza non trovata', 404);
        }

        $validStatuses = ['aperto', 'completato', 'scaduto', 'annullato'];
        $status = $body['status'] ?? 'aperto';
        if (!in_array($status, $validStatuses, true)) {
            Response::error("Stato non valido: {$status}", 400);
        }

        $data = [
            ':title' => htmlspecialchars(trim($body['title']), ENT_QUOTES, 'UTF-8'),
            ':due_date' => $body['due_date'],
            ':category' => $body['category'] ?? null,
            ':status' => $status,
            ':linked_document_id' => $body['linked_document_id'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ];

        $this->repo->updateDeadline($body['id'], $data);
        Audit::log('UPDATE', 'societa_deadlines', $body['id'], $before, $body);
        Response::success(['message' => 'Scadenza aggiornata']);
    }

    public function deleteDeadline(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getDeadlineById($id);
        if (!$before) {
            Response::error('Scadenza non trovata', 404);
        }
        $this->repo->deleteDeadline($id);
        Audit::log('DELETE', 'societa_deadlines', $id, $before, null);
        Response::success(['message' => 'Scadenza eliminata']);
    }

    // ─── SPONSORS ─────────────────────────────────────────────────────────────

    public function listSponsors(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listSponsors());
    }

    public function createSponsor(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name']);

        $id = 'SSP_' . bin2hex(random_bytes(4));
        $data = [
            ':id'             => $id,
            ':tenant_id'      => TenantContext::id(),
            ':name'           => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':description'    => $body['description'] ?? null,
            ':logo_path'      => $body['logo_path'] ?? null,
            ':website_url'    => $body['website_url'] ?? null,
            ':instagram_url'  => $body['instagram_url'] ?? null,
            ':facebook_url'   => $body['facebook_url'] ?? null,
            ':linkedin_url'   => $body['linkedin_url'] ?? null,
            ':tiktok_url'     => $body['tiktok_url'] ?? null,
            ':sort_order'     => (int)($body['sort_order'] ?? 0),
            ':is_active'      => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
        ];

        $this->repo->createSponsor($data);
        Audit::log('INSERT', 'societa_sponsors', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateSponsor(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'name']);

        $before = $this->repo->getSponsorById($body['id']);
        if (!$before) {
            Response::error('Sponsor non trovato', 404);
        }

        $data = [
            ':name'           => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':description'    => $body['description'] ?? null,
            ':logo_path'      => $body['logo_path'] ?? null,
            ':website_url'    => $body['website_url'] ?? null,
            ':instagram_url'  => $body['instagram_url'] ?? null,
            ':facebook_url'   => $body['facebook_url'] ?? null,
            ':linkedin_url'   => $body['linkedin_url'] ?? null,
            ':tiktok_url'     => $body['tiktok_url'] ?? null,
            ':sort_order'     => (int)($body['sort_order'] ?? 0),
            ':is_active'      => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
        ];

        $this->repo->updateSponsor($body['id'], $data);
        Audit::log('UPDATE', 'societa_sponsors', $body['id'], $before, $body);
        Response::success(['message' => 'Sponsor aggiornato']);
    }

    public function uploadSponsorLogo(): void
    {
        Auth::requireRole('manager');

        $sponsorId = $_POST['sponsor_id'] ?? '';
        if (empty($sponsorId)) {
            Response::error('sponsor_id obbligatorio', 400);
        }

        $sponsor = $this->repo->getSponsorById($sponsorId);
        if (!$sponsor) {
            Response::error('Sponsor non trovato', 404);
        }

        if (!isset($_FILES['logo']) || $_FILES['logo']['error'] !== UPLOAD_ERR_OK) {
            Response::error('Errore upload logo', 400);
        }

        $file = $_FILES['logo'];

        if ($file['size'] > self::MAX_FILE_SIZE) {
            Response::error('File troppo grande (max 10 MB)', 400);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($file['tmp_name']);
        if (!in_array($mime, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'], true)) {
            Response::error('Tipo file non consentito. Accettati: JPG, PNG, WEBP, SVG', 400);
        }

        $tenantId  = TenantContext::id();
        $uploadDir = dirname(__DIR__, 3) . '/uploads/societa/' . $tenantId . '/sponsors';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $ext      = pathinfo($file['name'], PATHINFO_EXTENSION);
        $fileName = 'sponsor_' . $sponsorId . '_' . date('Ymd_His') . '.' . $ext;
        $destPath = $uploadDir . '/' . $fileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Errore nel salvataggio del logo', 500);
        }

        $relPath = 'uploads/societa/' . $tenantId . '/sponsors/' . $fileName;
        $this->repo->updateSponsorLogo($sponsorId, $relPath);
        Audit::log('UPDATE', 'societa_sponsors', $sponsorId, ['logo_path' => $sponsor['logo_path']], ['logo_path' => $relPath]);
        Response::success(['logo_path' => $relPath], 200);
    }

    public function deleteSponsor(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getSponsorById($id);
        if (!$before) {
            Response::error('Sponsor non trovato', 404);
        }
        $this->repo->deleteSponsor($id);
        Audit::log('DELETE', 'societa_sponsors', $id, $before, null);
        Response::success(['message' => 'Sponsor eliminato']);
    }

    // ─── TITOLI ───────────────────────────────────────────────────────────────

    public function listTitoli(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listTitoli());
    }

    public function createTitolo(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['stagione', 'campionato', 'categoria', 'piazzamento']);

        $validCampionati = ['provinciale', 'regionale', 'nazionale'];
        if (!in_array($body['campionato'], $validCampionati, true)) {
            Response::error('Campionato non valido', 400);
        }

        $piazzamento = (int)($body['piazzamento'] ?? 0);
        if (!in_array($piazzamento, [1, 2, 3], true)) {
            Response::error('Piazzamento non valido (1, 2 o 3)', 400);
        }

        $id = 'STT_' . bin2hex(random_bytes(4));
        $data = [
            ':id'               => $id,
            ':tenant_id'        => TenantContext::id(),
            ':stagione'         => htmlspecialchars(trim($body['stagione']), ENT_QUOTES, 'UTF-8'),
            ':campionato'       => $body['campionato'],
            ':categoria'        => htmlspecialchars(trim($body['categoria']), ENT_QUOTES, 'UTF-8'),
            ':piazzamento'      => $piazzamento,
            ':finali_nazionali' => isset($body['finali_nazionali']) ? (int)(bool)$body['finali_nazionali'] : 0,
            ':note'             => $body['note'] ?? null,
        ];

        $this->repo->createTitolo($data);
        Audit::log('INSERT', 'societa_titoli', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateTitolo(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'stagione', 'campionato', 'categoria', 'piazzamento']);

        $before = $this->repo->getTitoloById($body['id']);
        if (!$before) {
            Response::error('Titolo non trovato', 404);
        }

        $validCampionati = ['provinciale', 'regionale', 'nazionale'];
        if (!in_array($body['campionato'], $validCampionati, true)) {
            Response::error('Campionato non valido', 400);
        }

        $piazzamento = (int)($body['piazzamento'] ?? 0);
        if (!in_array($piazzamento, [1, 2, 3], true)) {
            Response::error('Piazzamento non valido (1, 2 o 3)', 400);
        }

        $data = [
            ':stagione'         => htmlspecialchars(trim($body['stagione']), ENT_QUOTES, 'UTF-8'),
            ':campionato'       => $body['campionato'],
            ':categoria'        => htmlspecialchars(trim($body['categoria']), ENT_QUOTES, 'UTF-8'),
            ':piazzamento'      => $piazzamento,
            ':finali_nazionali' => isset($body['finali_nazionali']) ? (int)(bool)$body['finali_nazionali'] : 0,
            ':note'             => $body['note'] ?? null,
        ];

        $this->repo->updateTitolo($body['id'], $data);
        Audit::log('UPDATE', 'societa_titoli', $body['id'], $before, $body);
        Response::success(['message' => 'Titolo aggiornato']);
    }

    public function deleteTitolo(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getTitoloById($id);
        if (!$before) {
            Response::error('Titolo non trovato', 404);
        }
        $this->repo->deleteTitolo($id);
        Audit::log('DELETE', 'societa_titoli', $id, $before, null);
        Response::success(['message' => 'Titolo eliminato']);
    }

    // ─── FORESTERIA ────────────────────────────────────────────────────────────

    /** GET  ?module=societa&action=getForesteria — tutto in uno (info + spese + media) */
    public function getForesteria(): void
    {
        Auth::requireRole('operator');
        $db  = \FusionERP\Shared\Database::getInstance();
        $tid = TenantContext::id();

        // Info singleton
        $info = $db->prepare('SELECT * FROM foresteria_info WHERE tenant_id = ? LIMIT 1');
        $info->execute([$tid]);
        $infoRow = $info->fetch(\PDO::FETCH_ASSOC) ?: [
            'description' => '',
            'address'     => 'Via Bazzera 16, 30030 Martellago (VE)',
            'lat'         => 45.5440000,
            'lng'         => 12.1580000,
        ];

        // Spese (ultimi 100, più recenti prima)
        $expenses = $db->prepare(
            'SELECT * FROM foresteria_expenses
             WHERE tenant_id = ? AND is_deleted = 0
             ORDER BY expense_date DESC LIMIT 100'
        );
        $expenses->execute([$tid]);

        // Media
        $media = $db->prepare(
            'SELECT * FROM foresteria_media
             WHERE tenant_id = ? AND is_deleted = 0
             ORDER BY uploaded_at DESC LIMIT 200'
        );
        $media->execute([$tid]);

        Response::success([
            'info'     => $infoRow,
            'expenses' => $expenses->fetchAll(\PDO::FETCH_ASSOC),
            'media'    => $media->fetchAll(\PDO::FETCH_ASSOC),
        ]);
    }

    /** POST ?module=societa&action=saveForesteria — salva descrizione */
    public function saveForesteria(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $db   = \FusionERP\Shared\Database::getInstance();
        $tid  = TenantContext::id();

        $id = 'FOR_' . bin2hex(random_bytes(4));
        $desc = $body['description'] ?? null;

        $db->prepare(
            'INSERT INTO foresteria_info (id, tenant_id, description)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE description = VALUES(description)'
        )->execute([$id, $tid, $desc]);

        Audit::log('UPSERT', 'foresteria_info', $tid, null, ['description' => $desc]);
        Response::success(['message' => 'Descrizione salvata']);
    }

    /** POST ?module=societa&action=addExpense — aggiunge spesa */
    public function addExpense(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['description', 'amount', 'expense_date']);

        $db  = \FusionERP\Shared\Database::getInstance();
        $tid = TenantContext::id();
        $id  = 'FEX_' . bin2hex(random_bytes(4));

        $db->prepare(
            'INSERT INTO foresteria_expenses
             (id, tenant_id, description, amount, category, expense_date, notes, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )->execute([
            $id,
            $tid,
            htmlspecialchars(trim($body['description']), ENT_QUOTES, 'UTF-8'),
            (float)$body['amount'],
            $body['category'] ?? null,
            $body['expense_date'],
            $body['notes'] ?? null,
            Auth::requireAuth()['id'] ?? null,
        ]);

        Audit::log('INSERT', 'foresteria_expenses', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    /** POST ?module=societa&action=deleteExpense — soft-delete spesa */
    public function deleteExpense(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id   = $body['id'] ?? '';
        if (empty($id)) Response::error('id obbligatorio', 400);

        $db  = \FusionERP\Shared\Database::getInstance();
        $tid = TenantContext::id();

        $db->prepare(
            'UPDATE foresteria_expenses SET is_deleted = 1 WHERE id = ? AND tenant_id = ?'
        )->execute([$id, $tid]);

        Audit::log('DELETE', 'foresteria_expenses', $id, null, null);
        Response::success(['message' => 'Spesa rimossa']);
    }

    /** POST ?module=societa&action=uploadForesteriaMedia — upload foto/video */
    public function uploadForesteriaMedia(): void
    {
        Auth::requireRole('manager');

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('File non caricato', 400);
        }

        $file  = $_FILES['file'];
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime  = $finfo->file($file['tmp_name']);

        $allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $allowedVideo = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'];
        $isImage = in_array($mime, $allowedImage, true);
        $isVideo = in_array($mime, $allowedVideo, true);

        if (!$isImage && !$isVideo) {
            Response::error('Formato non supportato. Accettati: JPG, PNG, WEBP, MP4, WEBM, MOV', 415);
        }

        $tid      = TenantContext::id();
        $mediaDir = dirname(__DIR__, 3) . '/uploads/societa/' . $tid . '/foresteria';
        if (!is_dir($mediaDir)) mkdir($mediaDir, 0755, true);

        $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $filename = ($isVideo ? 'video' : 'photo') . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        $destPath = $mediaDir . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Errore salvataggio file', 500);
        }

        $relPath = 'uploads/societa/' . $tid . '/foresteria/' . $filename;
        $id      = 'FMD_' . bin2hex(random_bytes(4));
        $type    = $isVideo ? 'video' : 'photo';
        $title   = $_POST['title'] ?? null;
        $desc    = $_POST['description'] ?? null;

        $db = \FusionERP\Shared\Database::getInstance();
        $db->prepare(
            'INSERT INTO foresteria_media (id, tenant_id, type, file_path, title, description)
             VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([$id, $tid, $type, $relPath, $title, $desc]);

        Audit::log('INSERT', 'foresteria_media', $id, null, ['file_path' => $relPath, 'type' => $type]);
        Response::success(['id' => $id, 'file_path' => $relPath, 'type' => $type], 201);
    }

    /** POST ?module=societa&action=addForesteriaYoutubeLink — aggiunge link YouTube */
    public function addForesteriaYoutubeLink(): void
    {
        Auth::requireRole('manager');
        $body  = Response::jsonBody();
        $url   = trim($body['url'] ?? '');
        $title = trim($body['title'] ?? '');

        if (empty($url)) {
            Response::error('url obbligatorio', 400);
        }

        // Estrai l'ID video da vari formati YouTube
        $videoId = null;
        $patterns = [
            '/(?:youtube\.com\/watch\?(?:.*&)?v=)([a-zA-Z0-9_-]{11})/',
            '/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/',
            '/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/',
            '/(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/',
            '/(?:youtube\.com\/v\/)([a-zA-Z0-9_-]{11})/',
        ];
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $url, $matches)) {
                $videoId = $matches[1];
                break;
            }
        }

        if (!$videoId) {
            Response::error('URL YouTube non valido. Incolla il link di un video dal canale YouTube di Fusion.', 400);
        }

        $db  = \FusionERP\Shared\Database::getInstance();
        $tid = TenantContext::id();
        $id  = 'FMD_' . bin2hex(random_bytes(4));

        // Salva l'URL canonico del video
        $canonicalUrl = 'https://www.youtube.com/watch?v=' . $videoId;

        $db->prepare(
            'INSERT INTO foresteria_media (id, tenant_id, type, file_path, title, description)
             VALUES (?, ?, ?, ?, ?, ?)'
        )->execute([$id, $tid, 'youtube', $canonicalUrl, $title ?: $canonicalUrl, null]);

        Audit::log('INSERT', 'foresteria_media', $id, null, ['url' => $canonicalUrl, 'type' => 'youtube']);
        Response::success(['id' => $id, 'file_path' => $canonicalUrl, 'type' => 'youtube'], 201);
    }

    /** POST ?module=societa&action=deleteForesteriaMedia — soft-delete media */
    public function deleteForesteriaMedia(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id   = $body['id'] ?? '';
        if (empty($id)) Response::error('id obbligatorio', 400);

        $db  = \FusionERP\Shared\Database::getInstance();
        $tid = TenantContext::id();

        $db->prepare(
            'UPDATE foresteria_media SET is_deleted = 1 WHERE id = ? AND tenant_id = ?'
        )->execute([$id, $tid]);

        Audit::log('DELETE', 'foresteria_media', $id, null, null);
        Response::success(['message' => 'Media rimosso']);
    }
}