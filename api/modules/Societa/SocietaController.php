<?php
/**
 * Societa Controller — CRUD for societa_* tables
 * Fusion ERP v1.0
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

    private function handleServiceCall(callable $callback, int $successCode = 200)
    {
        try {
            $result = $callback();
            Response::success($result ?: ['message' => 'Operazione completata con successo'], $successCode);
        } catch (\Exception $e) {
            error_log('SocietaController Error: ' . $e->getMessage());
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $httpCode);
        }
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
        $this->handleServiceCall(function() use ($body) {
            $this->service->upsertProfile($body, TenantContext::id());
            return ['message' => 'Profilo società salvato'];
        });
    }

    public function uploadLogo(): void
    {
        Auth::requireRole('social media manager');
        if (empty($_FILES['logo'])) {
            Response::error('Errore upload logo (file mancante)', 400);
        }
        $this->handleServiceCall(function() {
            $relPath = $this->service->uploadLogo($_FILES['logo'], TenantContext::id());
            return ['logo_path' => $relPath];
        }, 201);
    }

    // ─── COMPANIES ────────────────────────────────────────────────────────────

    public function listCompanies(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listCompanies());
    }

    public function createCompany(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['name']);
        $this->handleServiceCall(fn() => $this->service->createCompany($body, TenantContext::id()), 201);
    }

    public function updateCompany(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'name']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->updateCompany($body['id'], $body);
            return ['message' => 'Azienda aggiornata'];
        });
    }

    public function deleteCompany(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteCompany($body['id']);
            return ['message' => 'Azienda eliminata'];
        });
    }

    public function uploadCompanyLogo(): void
    {
        Auth::requireRole('social media manager');
        $companyId = filter_input(INPUT_POST, 'company_id', FILTER_DEFAULT) ?: '';
        if (empty($companyId)) Response::error('company_id obbligatorio', 400);
        if (empty($_FILES['logo'])) Response::error('Errore upload logo mancante', 400);

        $this->handleServiceCall(function() use ($companyId) {
            $relPath = $this->service->uploadCompanyLogo($companyId, $_FILES['logo'], TenantContext::id());
            return ['logo_path' => $relPath];
        });
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
        $this->handleServiceCall(fn() => $this->service->createRole($body, TenantContext::id()), 201);
    }

    public function updateRole(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'name']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->updateRole($body['id'], $body);
            return ['message' => 'Ruolo aggiornato'];
        });
    }

    public function deleteRole(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteRole($body['id']);
            return ['message' => 'Ruolo eliminato'];
        });
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
        $this->handleServiceCall(fn() => $this->service->createMember($body, TenantContext::id()), 201);
    }

    public function updateMember(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'full_name', 'role_id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->updateMember($body['id'], $body);
            return ['message' => 'Membro aggiornato'];
        });
    }

    public function deleteMember(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteMember($body['id']);
            return ['message' => 'Membro rimosso'];
        });
    }

    public function uploadMemberPhoto(): void
    {
        Auth::requireRole('social media manager');
        $id = filter_input(INPUT_POST, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) Response::error('ID membro mancante', 400);
        if (empty($_FILES['file'])) Response::error('File non caricato', 400);

        $this->handleServiceCall(function() use ($id) {
            $relPath = $this->service->uploadMemberPhoto($id, $_FILES['file'], TenantContext::id());
            return ['photo_path' => $relPath];
        });
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
        if (empty($_FILES['file'])) Response::error('Errore upload file mancante', 400);

        $this->handleServiceCall(fn() => $this->service->uploadDocument($category, $_FILES['file'], TenantContext::id(), $expiryDate, $notes), 201);
    }

    public function downloadDocument(): void
    {
        Auth::requireRole('operator');
        $docId = filter_input(INPUT_GET, 'docId', FILTER_DEFAULT) ?? '';
        if (empty($docId)) Response::error('docId obbligatorio', 400);

        $doc = $this->repo->getDocumentById($docId);
        if (!$doc) Response::error('Documento non trovato', 404);

        $filePath = dirname(__DIR__, 3) . '/' . ltrim($doc['file_path'], '/');
        if (!file_exists($filePath)) Response::error('File non trovato sul server', 404);

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
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteDocument($body['id']);
            return ['message' => 'Documento eliminato'];
        });
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
        $this->handleServiceCall(fn() => $this->service->createDeadline($body, TenantContext::id()), 201);
    }

    public function updateDeadline(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'title', 'due_date']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->updateDeadline($body['id'], $body);
            return ['message' => 'Scadenza aggiornata'];
        });
    }

    public function deleteDeadline(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteDeadline($body['id']);
            return ['message' => 'Scadenza eliminata'];
        });
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
        $this->handleServiceCall(fn() => $this->service->createSponsor($body, TenantContext::id()), 201);
    }

    public function updateSponsor(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'name']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->updateSponsor($body['id'], $body);
            return ['message' => 'Sponsor aggiornato'];
        });
    }

    public function uploadSponsorLogo(): void
    {
        Auth::requireRole('social media manager');
        $sponsorId = filter_input(INPUT_POST, 'sponsor_id', FILTER_DEFAULT) ?: '';
        if (empty($sponsorId)) Response::error('sponsor_id obbligatorio', 400);
        if (empty($_FILES['logo'])) Response::error('Errore upload logo mancante', 400);

        $this->handleServiceCall(function() use ($sponsorId) {
            $relPath = $this->service->uploadSponsorLogo($sponsorId, $_FILES['logo'], TenantContext::id());
            return ['logo_path' => $relPath];
        });
    }

    public function deleteSponsor(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteSponsor($body['id']);
            return ['message' => 'Sponsor eliminato'];
        });
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
        $this->handleServiceCall(fn() => $this->service->createTitolo($body, TenantContext::id()), 201);
    }

    public function updateTitolo(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'stagione', 'campionato', 'categoria', 'piazzamento']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->updateTitolo($body['id'], $body);
            return ['message' => 'Titolo aggiornato'];
        });
    }

    public function deleteTitolo(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteTitolo($body['id']);
            return ['message' => 'Titolo eliminato'];
        });
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
        $tenantId = \FusionERP\Shared\TenantContext::id();

        // 1. Prova a recuperare gli sponsor specifici per il tenant risolto
        $stmt = $db->prepare(
            "SELECT id, name, tipo, description, logo_path, website_url, 
                    instagram_url, facebook_url, linkedin_url, tiktok_url,
                    stagione, rapporto, sponsorizzazione 
             FROM societa_sponsors 
             WHERE tenant_id = ? AND is_active = 1 AND is_deleted = 0
             ORDER BY sort_order ASC, name ASC"
        );
        $stmt->execute([$tenantId]);
        $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        // 2. Se vuoto (e non è il default), fallback su tutti gli sponsor attivi (globali)
        if (empty($data) && $tenantId !== 'TNT_fusion') {
            $stmt = $db->query(
                "SELECT id, name, tipo, description, logo_path, website_url, 
                        instagram_url, facebook_url, linkedin_url, tiktok_url,
                        stagione, rapporto, sponsorizzazione 
                 FROM societa_sponsors 
                 WHERE is_active = 1 AND is_deleted = 0
                 ORDER BY sort_order ASC, name ASC"
            );
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        }

        Response::success($data);
    }

    // ─── FORESTERIA ────────────────────────────────────────────────────────────

    public function getPublicForesteria(): void
    {
        $tenantId = TenantContext::id(); 
        $infoRow = $this->repo->getForesteriaInfo($tenantId);
        
        if (!$infoRow) {
            $infoRow = [
                'tenant_id'   => $tenantId,
                'description' => '',
                'address'     => 'Via Bazzera 18, 30030 Martellago (VE)',
                'lat'         => 45.5440000,
                'lng'         => 12.1580000,
            ];
        }

        $media = $this->repo->getForesteriaMedia($tenantId);

        Response::success([
            'info'  => $infoRow,
            'media' => $media,
        ]);
    }

    public function getPublicOrganigramma(): void
    {
        $roles = $this->repo->listRoles();
        // Return only active members for organigramma public view
        $members = array_filter($this->repo->listMembers(), function($m) {
            return (int)$m['is_active'] === 1;
        });
        
        Response::success([
            'roles' => $roles,
            'members' => array_values($members)
        ]);
    }

    public function getPublicTitoli(): void
    {
        $titoli = $this->repo->listTitoli();
        Response::success($titoli);
    }



    public function getForesteria(): void
    {
        Auth::requireRole('operator');
        $tid = TenantContext::id();
        $this->handleServiceCall(function() use ($tid) {
            return [
                'info'     => $this->service->getForesteriaFallbackInfo($tid),
                'expenses' => $this->repo->getForesteriaExpenses($tid),
                'media'    => $this->repo->getForesteriaMedia($tid),
            ];
        });
    }

    public function saveForesteria(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        $this->handleServiceCall(function() use ($body) {
            $this->service->saveForesteriaInfo($body, TenantContext::id());
            return ['message' => 'Dati salvati'];
        });
    }

    public function addExpense(): void
    {
        Auth::requireRole('operator');
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $body = (strpos($contentType, 'application/json') !== false) ? Response::jsonBody() : $_POST;
        Response::requireFields($body, ['description', 'amount', 'expense_date']);
        $user = Auth::requireAuth();

        $this->handleServiceCall(fn() => $this->service->createForesteriaExpense($body, $_FILES['receipt'] ?? null, TenantContext::id(), $user['id']), 201);
    }

    public function deleteExpense(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteForesteriaExpense($body['id'], TenantContext::id());
            return ['message' => 'Spesa rimossa'];
        });
    }

    public function uploadForesteriaMedia(): void
    {
        Auth::requireRole('operator');
        if (empty($_FILES['file'])) Response::error('File non caricato', 400);

        $this->handleServiceCall(function() {
            $title = filter_input(INPUT_POST, 'title', FILTER_DEFAULT) ?: null;
            $description = filter_input(INPUT_POST, 'description', FILTER_DEFAULT) ?: null;
            return $this->service->uploadForesteriaMedia($_FILES['file'], TenantContext::id(), $title, $description);
        }, 201);
    }

    public function addForesteriaYoutubeLink(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        Response::requireFields($body, ['url']);
        $this->handleServiceCall(fn() => $this->service->addForesteriaYoutubeLink($body['url'], $body['title'] ?? null, TenantContext::id()), 201);
    }

    public function deleteForesteriaMedia(): void
    {
        Auth::requireRole('operator');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id']);
        $this->handleServiceCall(function() use ($body) {
            $this->service->deleteForesteriaMedia($body['id'], TenantContext::id());
            return ['message' => 'Media rimosso'];
        });
    }
}