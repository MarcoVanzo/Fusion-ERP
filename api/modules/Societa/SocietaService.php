<?php
/**
 * Societa Service — Business Logic & File Uploads per il modulo Societa
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Societa;

use FusionERP\Shared\Audit;
use FusionERP\Shared\TenantContext;

class SocietaService
{
    private SocietaRepository $repo;
    private const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    public function __construct(SocietaRepository $repo)
    {
        $this->repo = $repo;
    }

    // ─── FILE UPLOAD INTERNALS ───────────────────────────────────────────

    private function validateUploadedFile(array $file, array $allowedMimes): string
    {
        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $file['error'] ?? -1;
            throw new \Exception("Errore in fase di caricamento (codice: {$errorCode}).", 400);
        }
        if ($file['size'] > self::MAX_FILE_SIZE) {
            throw new \Exception('File troppo grande (max 10 MB).', 400);
        }
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!in_array($mime, $allowedMimes, true)) {
            throw new \Exception("Tipo file non consentito ({$mime}).", 400);
        }
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        return strtolower($ext ?: 'bin');
    }

    private function storeFile(array $file, string $tenantId, string $subDir, string $fileName): string
    {
        $uploadDir = dirname(__DIR__, 3) . '/uploads/societa/' . $tenantId . '/' . $subDir;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        $destPath = $uploadDir . '/' . $fileName;
        $destPath = str_replace('//', '/', $destPath);
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            throw new \Exception('Errore nel salvataggio fisico del file sul server.', 500);
        }
        $relPath = 'uploads/societa/' . $tenantId . ($subDir ? '/' . $subDir : '') . '/' . $fileName;
        return str_replace('//', '/', $relPath);
    }

    // ─── PROFILE LOGIC ───────────────────────────────────────────────────

    public function upsertProfile(array $body, string $tenantId): void
    {
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
        Audit::log('UPSERT', 'societa_profile', $tenantId, null, $body);
    }

    public function uploadLogo(array $file, string $tenantId): string
    {
        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
        $ext = $this->validateUploadedFile($file, $allowed);
        $fileName = 'logo_' . date('Ymd_His') . '.' . $ext;
        return $this->storeFile($file, $tenantId, '', $fileName);
    }

    // ─── COMPANIES LOGIC ─────────────────────────────────────────────────

    public function createCompany(array $body, string $tenantId): array
    {
        $id = 'CMP_' . bin2hex(random_bytes(4));
        $data = [
            ':id'                => $id,
            ':tenant_id'         => $tenantId,
            ':name'              => htmlspecialchars(trim($body['name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':vat_number'        => htmlspecialchars(trim($body['vat_number'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':legal_address'     => htmlspecialchars(trim($body['legal_address'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':website'           => htmlspecialchars(trim($body['website'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':facebook'          => htmlspecialchars(trim($body['facebook'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':instagram'         => htmlspecialchars(trim($body['instagram'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':logo_path'         => $body['logo_path'] ?? null,
            ':referent_name'     => htmlspecialchars(trim($body['referent_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':referent_contact'  => htmlspecialchars(trim($body['referent_contact'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':description'       => $body['description'] ?? null,
        ];
        
        $this->repo->createCompany($data);
        Audit::log('INSERT', 'societa_companies', $id, null, $body);
        return ['id' => $id];
    }

    public function updateCompany(string $id, array $body): void
    {
        $before = $this->repo->getCompanyById($id);
        if (!$before) throw new \Exception('Azienda non trovata', 404);

        $data = [
            ':name'              => htmlspecialchars(trim($body['name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':vat_number'        => htmlspecialchars(trim($body['vat_number'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':legal_address'     => htmlspecialchars(trim($body['legal_address'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':website'           => htmlspecialchars(trim($body['website'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':facebook'          => htmlspecialchars(trim($body['facebook'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':instagram'         => htmlspecialchars(trim($body['instagram'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':logo_path'         => array_key_exists('logo_path', $body) ? $body['logo_path'] : $before['logo_path'],
            ':referent_name'     => htmlspecialchars(trim($body['referent_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':referent_contact'  => htmlspecialchars(trim($body['referent_contact'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':description'       => $body['description'] ?? null,
        ];

        $this->repo->updateCompany($id, $data);
        Audit::log('UPDATE', 'societa_companies', $id, $before, $body);
    }

    public function deleteCompany(string $id): void
    {
        $before = $this->repo->getCompanyById($id);
        if (!$before) throw new \Exception('Azienda non trovata', 404);
        
        $this->repo->deleteCompany($id);
        Audit::log('DELETE', 'societa_companies', $id, $before, null);
    }

    public function uploadCompanyLogo(string $companyId, array $file, string $tenantId): string
    {
        $company = $this->repo->getCompanyById($companyId);
        if (!$company) throw new \Exception('Azienda non trovata', 404);

        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
        $ext = $this->validateUploadedFile($file, $allowed);
        $fileName = 'company_' . $companyId . '_' . time() . '.' . $ext;
        
        $relPath = $this->storeFile($file, $tenantId, 'companies', $fileName);
        $this->repo->updateCompanyLogo($companyId, $relPath);
        Audit::log('UPDATE', 'societa_companies', $companyId, ['logo_path' => $company['logo_path']], ['logo_path' => $relPath]);
        
        return $relPath;
    }

    // ─── ROLES LOGIC ─────────────────────────────────────────────────────

    public function createRole(array $body, string $tenantId): array
    {
        $id = 'SRL_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => $tenantId,
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':description' => $body['description'] ?? null,
            ':permissions_json' => isset($body['permissions_json']) ? json_encode($body['permissions_json']) : null,
            ':parent_role_id' => $body['parent_role_id'] ?? null,
            ':sort_order' => (int)($body['sort_order'] ?? 0),
        ];
        $this->repo->createRole($data);
        Audit::log('INSERT', 'societa_roles', $id, null, $body);
        return ['id' => $id];
    }

    public function updateRole(string $id, array $body): void
    {
        $before = $this->repo->getRoleById($id);
        if (!$before) throw new \Exception('Ruolo non trovato', 404);

        $data = [
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':description' => $body['description'] ?? null,
            ':permissions_json' => isset($body['permissions_json']) ? json_encode($body['permissions_json']) : null,
            ':parent_role_id' => $body['parent_role_id'] ?? null,
            ':sort_order' => (int)($body['sort_order'] ?? 0),
        ];

        $this->repo->updateRole($id, $data);
        Audit::log('UPDATE', 'societa_roles', $id, $before, $body);
    }

    public function deleteRole(string $id): void
    {
        $before = $this->repo->getRoleById($id);
        if (!$before) throw new \Exception('Ruolo non trovato', 404);

        $this->repo->deleteRole($id);
        Audit::log('DELETE', 'societa_roles', $id, $before, null);
    }

    // ─── MEMBERS LOGIC ───────────────────────────────────────────────────

    public function createMember(array $body, string $tenantId): array
    {
        $id = 'SMB_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => $tenantId,
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
        return ['id' => $id];
    }

    public function updateMember(string $id, array $body): void
    {
        $before = $this->repo->getMemberById($id);
        if (!$before) throw new \Exception('Membro non trovato', 404);

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
        $this->repo->updateMember($id, $data);
        Audit::log('UPDATE', 'societa_members', $id, $before, $body);
    }

    public function deleteMember(string $id): void
    {
        $before = $this->repo->getMemberById($id);
        if (!$before) throw new \Exception('Membro non trovato', 404);

        $this->repo->deleteMember($id);
        Audit::log('DELETE', 'societa_members', $id, $before, null);
    }

    public function uploadMemberPhoto(string $memberId, array $file, string $tenantId): string
    {
        $member = $this->repo->getMemberById($memberId);
        if (!$member) throw new \Exception('Membro non trovato', 404);
        
        $oldPhotoPath = $member['photo_path'] ?? null;
        $allowed = ['image/jpeg', 'image/png', 'image/webp'];
        $ext = $this->validateUploadedFile($file, $allowed);
        $fileName = 'member_' . $memberId . '_' . time() . '.' . $ext;
        $newPath = $this->storeFile($file, $tenantId, 'members', $fileName);

        if (!empty($oldPhotoPath)) {
            $oldAbsolutePath = dirname(__DIR__, 3) . '/' . ltrim($oldPhotoPath, '/');
            if (file_exists($oldAbsolutePath)) @unlink($oldAbsolutePath);
        }

        $this->repo->updateMemberPhoto($memberId, $newPath);
        Audit::log('UPDATE', 'societa_members', $memberId, ['photo_path' => $oldPhotoPath], ['photo_path' => $newPath]);
        return $newPath;
    }

    // ─── DOCUMENTS LOGIC ─────────────────────────────────────────────────

    public function uploadDocument(string $category, array $file, string $tenantId, ?string $expiryDate, ?string $notes): array
    {
        $validCategories = ['statuto', 'affiliazione', 'licenza', 'assicurazione', 'altro'];
        if (!in_array($category, $validCategories, true)) {
            throw new \Exception("Categoria documento non valida: {$category}", 400);
        }

        $allowed = [
            'application/pdf', 
            'application/msword', 
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
        ];
        
        $ext = $this->validateUploadedFile($file, $allowed);
        $fileName = $category . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        $relPath = $this->storeFile($file, $tenantId, 'docs', $fileName);
        
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

        return [
            'id' => $docId,
            'file_path' => $relPath
        ];
    }
    
    public function deleteDocument(string $id): void
    {
        $doc = $this->repo->getDocumentById($id);
        if (!$doc) throw new \Exception('Documento non trovato', 404);
        
        $this->repo->deleteDocument($id);
        Audit::log('DELETE', 'societa_documents', $id, $doc, null);
    }

    // ─── DEADLINES LOGIC ─────────────────────────────────────────────────

    private function validateDeadlineStatus(?string $status): string
    {
        $validStatuses = ['aperto', 'completato', 'scaduto', 'annullato'];
        $s = $status ?? 'aperto';
        if (!in_array($s, $validStatuses, true)) {
            throw new \Exception("Stato non valido: {$s}", 400);
        }
        return $s;
    }

    public function createDeadline(array $body, string $tenantId): array
    {
        $status = $this->validateDeadlineStatus($body['status'] ?? null);
        $id = 'SDL_' . bin2hex(random_bytes(4));
        $data = [
            ':id' => $id,
            ':tenant_id' => $tenantId,
            ':title' => htmlspecialchars(trim($body['title']), ENT_QUOTES, 'UTF-8'),
            ':due_date' => $body['due_date'],
            ':category' => $body['category'] ?? null,
            ':status' => $status,
            ':linked_document_id' => $body['linked_document_id'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ];
        $this->repo->createDeadline($data);
        Audit::log('INSERT', 'societa_deadlines', $id, null, $body);
        return ['id' => $id];
    }

    public function updateDeadline(string $id, array $body): void
    {
        $before = $this->repo->getDeadlineById($id);
        if (!$before) throw new \Exception('Scadenza non trovata', 404);

        $status = $this->validateDeadlineStatus($body['status'] ?? null);
        $data = [
            ':title' => htmlspecialchars(trim($body['title']), ENT_QUOTES, 'UTF-8'),
            ':due_date' => $body['due_date'],
            ':category' => $body['category'] ?? null,
            ':status' => $status,
            ':linked_document_id' => $body['linked_document_id'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ];
        $this->repo->updateDeadline($id, $data);
        Audit::log('UPDATE', 'societa_deadlines', $id, $before, $body);
    }

    public function deleteDeadline(string $id): void
    {
        $before = $this->repo->getDeadlineById($id);
        if (!$before) throw new \Exception('Scadenza non trovata', 404);

        $this->repo->deleteDeadline($id);
        Audit::log('DELETE', 'societa_deadlines', $id, $before, null);
    }

    // ─── SPONSORS LOGIC ──────────────────────────────────────────────────

    public function createSponsor(array $body, string $tenantId): array
    {
        $id = 'SSP_' . bin2hex(random_bytes(4));
        $data = [
            ':id'             => $id,
            ':tenant_id'      => $tenantId,
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
            ':rapporto'       => $body['rapporto'] ?? null,
            ':sponsorizzazione'=> $body['sponsorizzazione'] ?? null,
            ':sort_order'     => (int)($body['sort_order'] ?? 0),
            ':is_active'      => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
        ];

        $this->repo->createSponsor($data);
        Audit::log('INSERT', 'societa_sponsors', $id, null, $body);
        return ['id' => $id];
    }

    public function updateSponsor(string $id, array $body): void
    {
        $before = $this->repo->getSponsorById($id);
        if (!$before) throw new \Exception('Sponsor non trovato', 404);

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
            ':rapporto'       => $body['rapporto'] ?? null,
            ':sponsorizzazione'=> $body['sponsorizzazione'] ?? null,
            ':sort_order'     => (int)($body['sort_order'] ?? 0),
            ':is_active'      => isset($body['is_active']) ? (int)(bool)$body['is_active'] : 1,
        ];

        $this->repo->updateSponsor($id, $data);
        Audit::log('UPDATE', 'societa_sponsors', $id, $before, $body);
    }

    public function deleteSponsor(string $id): void
    {
        $before = $this->repo->getSponsorById($id);
        if (!$before) throw new \Exception('Sponsor non trovato', 404);
        
        $this->repo->deleteSponsor($id);
        Audit::log('DELETE', 'societa_sponsors', $id, $before, null);
    }

    public function uploadSponsorLogo(string $sponsorId, array $file, string $tenantId): string
    {
        $sponsor = $this->repo->getSponsorById($sponsorId);
        if (!$sponsor) throw new \Exception('Sponsor non trovato', 404);

        $allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
        $ext = $this->validateUploadedFile($file, $allowed);
        $fileName = 'sponsor_' . $sponsorId . '_' . date('Ymd_His') . '.' . $ext;
        
        $relPath = $this->storeFile($file, $tenantId, 'sponsors', $fileName);
        $this->repo->updateSponsorLogo($sponsorId, $relPath);
        Audit::log('UPDATE', 'societa_sponsors', $sponsorId, ['logo_path' => $sponsor['logo_path']], ['logo_path' => $relPath]);
        
        return $relPath;
    }

    // ─── TITOLI LOGIC ────────────────────────────────────────────────────

    public function createTitolo(array $body, string $tenantId): array
    {
        $validCampionati = ['provinciale', 'regionale', 'nazionale'];
        if (!in_array($body['campionato'], $validCampionati, true)) {
            throw new \Exception('Campionato non valido', 400);
        }
        $piazzamento = (int)($body['piazzamento'] ?? 0);
        if (!in_array($piazzamento, [1, 2, 3], true)) {
            throw new \Exception('Piazzamento non valido (1, 2 o 3)', 400);
        }

        $id = 'STT_' . bin2hex(random_bytes(4));
        $data = [
            ':id'               => $id,
            ':tenant_id'        => $tenantId,
            ':stagione'         => htmlspecialchars(trim($body['stagione']), ENT_QUOTES, 'UTF-8'),
            ':campionato'       => $body['campionato'],
            ':categoria'        => htmlspecialchars(trim($body['categoria']), ENT_QUOTES, 'UTF-8'),
            ':piazzamento'      => $piazzamento,
            ':finali_nazionali' => isset($body['finali_nazionali']) ? (int)(bool)$body['finali_nazionali'] : 0,
            ':note'             => $body['note'] ?? null,
        ];
        $this->repo->createTitolo($data);
        Audit::log('INSERT', 'societa_titoli', $id, null, $body);
        return ['id' => $id];
    }

    public function updateTitolo(string $id, array $body): void
    {
        $before = $this->repo->getTitoloById($id);
        if (!$before) throw new \Exception('Titolo non trovato', 404);

        $validCampionati = ['provinciale', 'regionale', 'nazionale'];
        if (!in_array($body['campionato'], $validCampionati, true)) {
            throw new \Exception('Campionato non valido', 400);
        }
        $piazzamento = (int)($body['piazzamento'] ?? 0);
        if (!in_array($piazzamento, [1, 2, 3], true)) {
            throw new \Exception('Piazzamento non valido (1, 2 o 3)', 400);
        }

        $data = [
            ':stagione'         => htmlspecialchars(trim($body['stagione']), ENT_QUOTES, 'UTF-8'),
            ':campionato'       => $body['campionato'],
            ':categoria'        => htmlspecialchars(trim($body['categoria']), ENT_QUOTES, 'UTF-8'),
            ':piazzamento'      => $piazzamento,
            ':finali_nazionali' => isset($body['finali_nazionali']) ? (int)(bool)$body['finali_nazionali'] : 0,
            ':note'             => $body['note'] ?? null,
        ];
        $this->repo->updateTitolo($id, $data);
        Audit::log('UPDATE', 'societa_titoli', $id, $before, $body);
    }

    public function deleteTitolo(string $id): void
    {
        $before = $this->repo->getTitoloById($id);
        if (!$before) throw new \Exception('Titolo non trovato', 404);
        
        $this->repo->deleteTitolo($id);
        Audit::log('DELETE', 'societa_titoli', $id, $before, null);
    }

    // ─── FORESTERIA LOGIC ────────────────────────────────────────────────

    public function getForesteriaFallbackInfo(string $tenantId): array
    {
        $info = $this->repo->getForesteriaInfo($tenantId);
        if (!$info) {
            return [
                'description' => '',
                'address'     => 'Via Bazzera 18, 30030 Martellago (VE)',
                'lat'         => 45.5440000,
                'lng'         => 12.1580000,
            ];
        }
        return $info;
    }

    public function saveForesteriaInfo(array $body, string $tenantId): void
    {
        $desc = $body['description'] ?? null;
        $address = $body['address'] ?? 'Via Bazzera 18, 30030 Martellago (VE)';

        $this->repo->upsertForesteriaInfo([
            ':id' => 'FOR_' . bin2hex(random_bytes(4)),
            ':tenant_id' => $tenantId,
            ':description' => isset($desc) ? htmlspecialchars(trim($desc), ENT_QUOTES, 'UTF-8') : null,
            ':address'     => htmlspecialchars(trim($address), ENT_QUOTES, 'UTF-8'),
            ':lat'         => 45.5440000,
            ':lng'         => 12.1580000
        ]);

        Audit::log('UPSERT', 'foresteria_info', $tenantId, null, ['description' => $desc, 'address' => $address]);
    }

    public function createForesteriaExpense(array $body, ?array $file, string $tenantId, string $userId): array
    {
        $receiptPath = null;
        if ($file && $file['error'] === UPLOAD_ERR_OK) {
            if ($file['size'] > self::MAX_FILE_SIZE) {
                throw new \Exception('Ricevuta troppo grande (max 10 MB).', 400);
            }
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION) ?: 'jpg';
            $fileName = 'receipt_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . strtolower($ext);
            
            $uploadDir = dirname(__DIR__, 3) . '/uploads/societa/' . $tenantId . '/foresteria';
            if (!is_dir($uploadDir)) mkdir($uploadDir, 0777, true);
            
            $destPath = $uploadDir . '/' . $fileName;
            if (move_uploaded_file($file['tmp_name'], $destPath)) {
                $receiptPath = 'uploads/societa/' . $tenantId . '/foresteria/' . $fileName;
            }
        }

        $id = 'FEX_' . bin2hex(random_bytes(4));
        $data = [
            ':id'           => $id,
            ':tenant_id'    => $tenantId,
            ':description'  => htmlspecialchars(trim($body['description'] ?? ''), ENT_QUOTES, 'UTF-8'),
            ':amount'       => (float)($body['amount'] ?? 0),
            ':category'     => $body['category'] ?? null,
            ':expense_date' => $body['expense_date'],
            ':receipt_path' => $receiptPath,
            ':notes'        => $body['notes'] ?? null,
            ':created_by'   => $userId,
        ];

        $this->repo->insertForesteriaExpense($data);
        Audit::log('INSERT', 'foresteria_expenses', $id, null, $body);

        return ['id' => $id, 'receipt_path' => $receiptPath];
    }
    
    public function deleteForesteriaExpense(string $id, string $tenantId): void
    {
        $this->repo->deleteForesteriaExpense($id, $tenantId);
        Audit::log('DELETE', 'foresteria_expenses', $id, null, null);
    }
    
    public function uploadForesteriaMedia(array $file, string $tenantId, ?string $title, ?string $desc): array
    {
        $allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'];
        
        if (!isset($file['error']) || $file['error'] !== UPLOAD_ERR_OK) {
            throw new \Exception('Errore di caricamento o file mancante.', 400);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        
        $isImg = in_array($mime, $allowedImages, true);
        $isVid = in_array($mime, $allowedVideos, true);
        
        if (!$isImg && !$isVid) {
            throw new \Exception('Formato non supportato. Accettati: JPG, PNG, WEBP, MP4, WEBM, MOV.', 400);
        }

        $type = $isVid ? 'video' : 'photo';
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $fileName = $type . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        $relPath = $this->storeFile($file, $tenantId, 'foresteria', $fileName);

        $id = 'FMD_' . bin2hex(random_bytes(4));
        $this->repo->insertForesteriaMedia([
            ':id'          => $id,
            ':tenant_id'   => $tenantId,
            ':type'        => $type,
            ':file_path'   => $relPath,
            ':title'       => $title,
            ':description' => $desc
        ]);

        Audit::log('INSERT', 'foresteria_media', $id, null, ['file_path' => $relPath, 'type' => $type]);
        return ['id' => $id, 'type' => $type, 'file_path' => $relPath, 'title' => $title, 'description' => $desc];
    }
    
    public function addForesteriaYoutubeLink(string $url, ?string $title, string $tenantId): array
    {
        $url = trim($url);
        if (empty($url)) throw new \Exception("URL YouTube obbligatorio.", 400);

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
        if (!$videoId) throw new \Exception('URL YouTube non valido.', 400);

        $canonicalUrl = 'https://www.youtube.com/watch?v=' . $videoId;
        $id = 'FMD_' . bin2hex(random_bytes(4));
        
        $this->repo->insertForesteriaMedia([
            ':id'          => $id,
            ':tenant_id'   => $tenantId,
            ':type'        => 'youtube',
            ':file_path'   => $canonicalUrl,
            ':title'       => $title ?: $canonicalUrl,
            ':description' => null
        ]);

        Audit::log('INSERT', 'foresteria_media', $id, null, ['url' => $canonicalUrl, 'type' => 'youtube']);
        
        return [
            'id' => $id,
            'type' => 'youtube',
            'file_path' => $canonicalUrl,
            'title' => $title ?: $canonicalUrl,
            'description' => null
        ];
    }

    public function deleteForesteriaMedia(string $id, string $tenantId): void
    {
        $this->repo->deleteForesteriaMedia($id, $tenantId);
        Audit::log('DELETE', 'foresteria_media', $id, null, null);
    }
}
