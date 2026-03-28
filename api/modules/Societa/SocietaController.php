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
require_once __DIR__ . '/SocietaService.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class SocietaController
{
    private SocietaRepository $repo;
    private SocietaService $service;

    public function __construct()
    {
        $this->repo = new SocietaRepository();
        $this->service = new SocietaService($this->repo);
    }

    // ─── PROFILE ──────────────────────────────────────────────────────────────

    public function getProfile(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->getProfile());
    }

    public function saveProfile(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();

        $data = [
            ':mission' => isset($body['mission']) ? htmlspecialchars(trim($body['mission']), ENT_QUOTES, 'UTF-8') : null,
            ':vision' => isset($body['vision']) ? htmlspecialchars(trim($body['vision']), ENT_QUOTES, 'UTF-8') : null,
            ':values' => isset($body['values']) ? htmlspecialchars(trim($body['values']), ENT_QUOTES, 'UTF-8') : null,
            ':founded_year' => isset($body['founded_year']) ? (int)$body['founded_year'] : null,
            ':primary_color' => isset($body['primary_color']) ? htmlspecialchars(trim($body['primary_color']), ENT_QUOTES, 'UTF-8') : null,
            ':secondary_color' => isset($body['secondary_color']) ? htmlspecialchars(trim($body['secondary_color']), ENT_QUOTES, 'UTF-8') : null,
            ':logo_path' => $body['logo_path'] ?? null,
            ':legal_address' => isset($body['legal_address']) ? htmlspecialchars(trim($body['legal_address']), ENT_QUOTES, 'UTF-8') : null,
            ':operative_address' => isset($body['operative_address']) ? htmlspecialchars(trim($body['operative_address']), ENT_QUOTES, 'UTF-8') : null,
        ];

        $this->repo->upsertProfile($data);
        Audit::log('UPSERT', 'societa_profile', TenantContext::id(), null, $body);
        Response::success(['message' => 'Profilo società salvato']);
    }

    // ─── LOGO UPLOAD ──────────────────────────────────────────────────────────

    public function uploadLogo(): void
    {
        Auth::requireRole('social media manager');

        if (!isset($_FILES['logo'])) {
            Response::error('Errore upload logo (file mancante)', 400);
        }

        try {
            $relPath = $this->service->uploadLogo($_FILES['logo'], TenantContext::id());
            Response::success(['logo_path' => $relPath], 201);
        } catch (\Exception $e) {
            error_log('Upload Logo Error: ' . $e->getMessage());
            Response::error('Errore durante il caricamento del logo.', 500);
        }
    }

    // ─── ROLES ────────────────────────────────────────────────────────────────

    public function listRoles(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listRoles());
    }

    public function createRole(): void
    {
        Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $id = $body['id'];

        $before = $this->repo->getMemberById($id);
        if (!$before) {
            Response::error('Membro non trovato', 404);
        }

        $this->repo->deleteMember($id);
        Audit::log('DELETE', 'societa_members', $id, $before, null);
        Response::success(['message' => 'Membro rimosso']);
    }

    public function uploadMemberPhoto(): void
    {
        Auth::requireRole('social media manager');
        
        $id = filter_input(INPUT_POST, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) {
            Response::error('ID membro mancante', 400);
        }

        $member = $this->repo->getMemberById($id);
        if (!$member) {
            Response::error('Membro non trovato', 404);
        }

        if (empty($_FILES['file'])) {
            Response::error('File non caricato', 400);
        }

        try {
            $relPath = $this->service->uploadMemberPhoto($id, $_FILES['file'], TenantContext::id(), $member['photo_path'] ?? null);
            $this->repo->updateMemberPhoto($id, $relPath);
            Audit::log('UPDATE', 'societa_members', $id, ['photo_path' => $member['photo_path'] ?? null], ['photo_path' => $relPath]);
            Response::success(['photo_path' => $relPath]);
        } catch (\Exception $e) {
            error_log('Upload Member Photo Error: ' . $e->getMessage());
            Response::error('Errore durante il caricamento della foto.', 500);
        }
    }

    // ─── DOCUMENTS ────────────────────────────────────────────────────────────

    public function listDocuments(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listDocuments());
    }

    public function uploadDocument(): void
    {
        Auth::requireRole('social media manager');

        $category = filter_input(INPUT_POST, 'category', FILTER_DEFAULT) ?: 'altro';
        $expiryDate = filter_input(INPUT_POST, 'expiry_date', FILTER_DEFAULT) ?: null;
        $notes = filter_input(INPUT_POST, 'notes', FILTER_DEFAULT) ?: null;

        if (empty($_FILES['file'])) {
            Response::error('Errore upload file mancante', 400);
        }

        try {
            $uploaded = $this->service->uploadDocument($category, $_FILES['file'], TenantContext::id());
            $docId = 'SDC_' . bin2hex(random_bytes(4));

            $this->repo->insertDocument([
                ':id' => $docId,
                ':tenant_id' => TenantContext::id(),
                ':category' => $category,
                ':file_path' => $uploaded['file_path'],
                ':file_name' => $uploaded['file_name'],
                ':expiry_date' => $expiryDate ?: null,
                ':notes' => $notes,
            ]);

            Audit::log('INSERT', 'societa_documents', $docId, null, [
                'category' => $category,
                'file_name' => $uploaded['file_name'],
            ]);

            Response::success(['id' => $docId, 'file_path' => $uploaded['file_path']], 201);
        } catch (\Exception $e) {
            error_log('Upload Document Error: ' . $e->getMessage());
            Response::error('Errore durante il caricamento del documento.', 500);
        }
    }

    public function downloadDocument(): void
    {
        Auth::requireRole('operator');
        $docId = filter_input(INPUT_GET, 'docId', FILTER_DEFAULT) ?? '';
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
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        
        $docId = $body['id'];
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
        Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        
        $id = $body['id'];
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
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name']);

        $id = 'SSP_' . bin2hex(random_bytes(4));
        $data = [
            ':id'             => $id,
            ':tenant_id'      => TenantContext::id(),
            ':name'           => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':tipo'           => htmlspecialchars(trim($body['tipo'] ?? 'Sponsor'), ENT_QUOTES, 'UTF-8'),
            ':stagione'       => $body['stagione'] ?? null,
            ':description'    => $body['description'] ?? null,
            ':logo_path'      => $body['logo_path'] ?? null,
            ':website_url'    => $body['website_url'] ?? null,
            ':instagram_url'  => $body['instagram_url'] ?? null,
            ':facebook_url'   => $body['facebook_url'] ?? null,
            ':linkedin_url'   => $body['linkedin_url'] ?? null,
            ':tiktok_url'     => $body['tiktok_url'] ?? null,
            ':importo'        => isset($body['importo']) && $body['importo'] !== '' ? (float)$body['importo'] : null,
            ':rapporto'       => isset($body['rapporto']) && $body['rapporto'] !== '' ? (float)$body['rapporto'] : null,
            ':sponsorizzazione'=> isset($body['sponsorizzazione']) && $body['sponsorizzazione'] !== '' ? (float)$body['sponsorizzazione'] : null,
            ':sort_order'     => (int)($body['sort_order'] ?? 0),
            ':is_active'      => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
        ];

        $this->repo->createSponsor($data);
        Audit::log('INSERT', 'societa_sponsors', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateSponsor(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'name']);

        $before = $this->repo->getSponsorById($body['id']);
        if (!$before) {
            Response::error('Sponsor non trovato', 404);
        }

        $data = [
            ':name'           => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':tipo'           => htmlspecialchars(trim($body['tipo'] ?? 'Sponsor'), ENT_QUOTES, 'UTF-8'),
            ':stagione'       => $body['stagione'] ?? null,
            ':description'    => $body['description'] ?? null,
            ':logo_path'      => array_key_exists('logo_path', $body) ? $body['logo_path'] : $before['logo_path'],
            ':website_url'    => $body['website_url'] ?? null,
            ':instagram_url'  => $body['instagram_url'] ?? null,
            ':facebook_url'   => $body['facebook_url'] ?? null,
            ':linkedin_url'   => $body['linkedin_url'] ?? null,
            ':tiktok_url'     => $body['tiktok_url'] ?? null,
            ':importo'        => isset($body['importo']) && $body['importo'] !== '' ? (float)$body['importo'] : null,
            ':rapporto'       => isset($body['rapporto']) && $body['rapporto'] !== '' ? (float)$body['rapporto'] : null,
            ':sponsorizzazione'=> isset($body['sponsorizzazione']) && $body['sponsorizzazione'] !== '' ? (float)$body['sponsorizzazione'] : null,
            ':sort_order'     => (int)($body['sort_order'] ?? 0),
            ':is_active'      => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
        ];

        $this->repo->updateSponsor($body['id'], $data);
        Audit::log('UPDATE', 'societa_sponsors', $body['id'], $before, $body);
        Response::success(['message' => 'Sponsor aggiornato']);
    }

    public function uploadSponsorLogo(): void
    {
        Auth::requireRole('social media manager');

        $sponsorId = filter_input(INPUT_POST, 'sponsor_id', FILTER_DEFAULT) ?: '';
        if (empty($sponsorId)) {
            Response::error('sponsor_id obbligatorio', 400);
        }

        $sponsor = $this->repo->getSponsorById($sponsorId);
        if (!$sponsor) {
            Response::error('Sponsor non trovato', 404);
        }

        if (empty($_FILES['logo'])) {
            Response::error('Errore upload logo mancante', 400);
        }

        try {
            $relPath = $this->service->uploadSponsorLogo($sponsorId, $_FILES['logo'], TenantContext::id());
            $this->repo->updateSponsorLogo($sponsorId, $relPath);
            Audit::log('UPDATE', 'societa_sponsors', $sponsorId, ['logo_path' => $sponsor['logo_path']], ['logo_path' => $relPath]);
            Response::success(['logo_path' => $relPath], 200);
        } catch (\Exception $e) {
            error_log('Upload Sponsor Logo Error: ' . $e->getMessage());
            Response::error('Errore durante il caricamento del logo sponsor.', 500);
        }
    }

    public function deleteSponsor(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        
        $id = $body['id'];
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
        Auth::requireRole('social media manager');
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

        try {
            $this->repo->createTitolo($data);
        } catch (\Exception $e) {
            error_log('Create Titolo Error: ' . $e->getMessage());
            Response::error('Errore durante la creazione del titolo.', 500);
        }
        
        Audit::log('INSERT', 'societa_titoli', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    public function updateTitolo(): void
    {
        Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        
        $id = $body['id'];
        $before = $this->repo->getTitoloById($id);
        if (!$before) {
            Response::error('Titolo non trovato', 404);
        }
        
        $this->repo->deleteTitolo($id);
        Audit::log('DELETE', 'societa_titoli', $id, $before, null);
        Response::success(['message' => 'Titolo eliminato']);
    }

    // ─── PUBLIC ENDPOINTS FOR WEBSITE ─────────────────────────────────────────

    public function getPublicProfile(): void
    {
        $profile = $this->repo->getProfile();
        if (!$profile) {
            $profile = [
                'mission'         => null,
                'vision'          => null,
                'values'          => null,
                'founded_year'    => null,
                'logo_path'       => null,
                'primary_color'   => null,
                'secondary_color' => null,
            ];
        }
        Response::success($profile);
    }

    public function getPublicSponsors(): void
    {
        $db = \FusionERP\Shared\Database::getInstance();
        $stmt = $db->query(
            "SELECT id, name, tipo, description, logo_path, website_url, 
                    instagram_url, facebook_url, linkedin_url, tiktok_url 
             FROM societa_sponsors 
             WHERE is_active = 1 AND is_deleted = 0
             ORDER BY sort_order ASC, name ASC"
        );
        Response::success($stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    // ─── FORESTERIA ────────────────────────────────────────────────────────────

    public function getPublicForesteria(): void
    {
        $tenantId = null; 
        
        // Cerca info di foresteria per il sito publico (non autenticato)
        $infoRow = $this->repo->getForesteriaInfo(null);
        
        if (!$infoRow) {
            $infoRow = [
                'description' => '',
                'address'     => 'Via Bazzera 16, 30030 Martellago (VE)',
                'lat'         => 45.5440000,
                'lng'         => 12.1580000,
            ];
            $tenantId = null;
        } else {
            $tenantId = $infoRow['tenant_id'];
            $infoRow['address'] = 'Via Bazzera 16, 30030 Martellago (VE)';
            $infoRow['lat'] = 45.5440000;
            $infoRow['lng'] = 12.1580000;
        }

        // Se tenantId è null (non ha ancora salvato info), proviamo a prendere la prima foresteria_media o bypassare il tenant.
        $db = \FusionERP\Shared\Database::getInstance();
        if ($tenantId) {
            $media = $this->repo->getForesteriaMedia($tenantId);
        } else {
            $stmt = $db->query("SELECT * FROM foresteria_media WHERE is_deleted = 0 ORDER BY created_at DESC");
            $media = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }

        Response::success([
            'info'  => $infoRow,
            'media' => $media,
        ]);
    }

    public function getForesteria(): void
    {
        Auth::requireRole('operator');
        $tid = TenantContext::id();

        try {
            Response::success([
                'info'     => $this->service->getForesteriaFallbackInfo($tid),
                'expenses' => $this->repo->getForesteriaExpenses($tid),
                'media'    => $this->repo->getForesteriaMedia($tid),
            ]);
        } catch (\PDOException $e) {
            error_log("[SocietaController] getForesteria DB Error: " . $e->getMessage() . " (TID: $tid)");
            Response::error("Errore nel recupero dei dati Foresteria ($tid). Verifica le tabelle DB.", 500);
        } catch (\Throwable $e) {
            error_log("[SocietaController] getForesteria Fatal Error: " . $e->getMessage());
            Response::error("Errore imprevisto durante il caricamento Foresteria.", 500);
        }
    }

    public function saveForesteria(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        $tid = TenantContext::id();
        $desc = $body['description'] ?? null;

        $this->repo->upsertForesteriaInfo([
            ':id' => 'FOR_' . bin2hex(random_bytes(4)),
            ':tenant_id' => $tid,
            ':description' => isset($desc) ? htmlspecialchars(trim($desc), ENT_QUOTES, 'UTF-8') : null
        ]);

        Audit::log('UPSERT', 'foresteria_info', $tid, null, ['description' => $desc]);
        Response::success(['message' => 'Descrizione salvata']);
    }

    public function addExpense(): void
    {
        Auth::requireRole('operator');
        
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $body = (strpos($contentType, 'application/json') !== false) ? Response::jsonBody() : $_POST;
        Response::requireFields($body, ['description', 'amount', 'expense_date']);

        $tid = TenantContext::id();
        $user = Auth::requireAuth();

        try {
            $processed = $this->service->processForesteriaExpense($body, $_FILES['receipt'] ?? null, $tid, $user['id']);
            $this->repo->insertForesteriaExpense($processed['data']);
            
            Audit::log('INSERT', 'foresteria_expenses', $processed['id'], null, $body);
            Response::success(['id' => $processed['id'], 'receipt_path' => $processed['receipt_path']], 201);
        } catch (\Exception $e) {
            error_log('Add Expense Error: ' . $e->getMessage());
            Response::error('Errore tecnico durante il salvataggio della spesa.', 500);
        }
    }

    public function deleteExpense(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        
        $this->repo->deleteForesteriaExpense($body['id'], TenantContext::id());
        Audit::log('DELETE', 'foresteria_expenses', $body['id'], null, null);
        Response::success(['message' => 'Spesa rimossa']);
    }

    public function uploadForesteriaMedia(): void
    {
        Auth::requireRole('operator');

        if (empty($_FILES['file'])) {
            Response::error('File non caricato', 400);
        }

        $tid = TenantContext::id();
        try {
            $title = filter_input(INPUT_POST, 'title', FILTER_DEFAULT) ?: null;
            $description = filter_input(INPUT_POST, 'description', FILTER_DEFAULT) ?: null;
            $media = $this->service->uploadForesteriaMedia($_FILES['file'], $tid, $title, $description);
            
            $this->repo->insertForesteriaMedia([
                ':id'          => $media['id'],
                ':tenant_id'   => $tid,
                ':type'        => $media['type'],
                ':file_path'   => $media['file_path'],
                ':title'       => $media['title'],
                ':description' => $media['description']
            ]);

            Audit::log('INSERT', 'foresteria_media', $media['id'], null, ['file_path' => $media['file_path'], 'type' => $media['type']]);
            Response::success($media, 201);
        } catch (\Exception $e) {
             error_log('Upload Foresteria Media Error: ' . $e->getMessage());
             Response::error('Errore durante il caricamento del media.', 500);
        }
    }

    public function addForesteriaYoutubeLink(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        Response::requireFields($body, ['url']);

        try {
            $media = $this->service->parseForesteriaYoutubeLink($body['url'], $body['title'] ?? null);
            $media['tenant_id'] = TenantContext::id();

            $this->repo->insertForesteriaMedia([
                ':id'          => $media['id'],
                ':tenant_id'   => $media['tenant_id'],
                ':type'        => $media['type'],
                ':file_path'   => $media['file_path'],
                ':title'       => $media['title'],
                ':description' => $media['description']
            ]);

            Audit::log('INSERT', 'foresteria_media', $media['id'], null, ['url' => $media['file_path'], 'type' => 'youtube']);
            Response::success($media, 201);
        } catch (\Exception $e) {
            error_log('Add Foresteria Youtube Link Error: ' . $e->getMessage());
            Response::error('Errore durante il salvataggio del link.', 500);
        }
    }

    public function deleteForesteriaMedia(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);

        $id = $body['id'];
        $this->repo->deleteForesteriaMedia($id, TenantContext::id());
        
        Audit::log('DELETE', 'foresteria_media', $id, null, null);
        Response::success(['message' => 'Media rimosso']);
    }
}