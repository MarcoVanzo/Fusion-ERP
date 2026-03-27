<?php
/**
 * Societa Repository — DB queries for societa_* tables
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Societa;

// Explicit require_once needed because server uses optimized classmap autoloader
$_societaShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_societaShared . 'TenantContext.php';
unset($_societaShared);

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

class SocietaRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── PROFILE ──────────────────────────────────────────────────────────────

    public function getProfile(): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare('SELECT * FROM societa_profile WHERE tenant_id = :tid LIMIT 1');
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function upsertProfile(array $data): void
    {
        $tenantId = TenantContext::id();
        $existing = $this->getProfile();

        if ($existing) {
            $stmt = $this->db->prepare(
                'UPDATE societa_profile SET
                    mission            = :mission,
                    vision             = :vision,
                    `values`           = :values,
                    founded_year       = :founded_year,
                    primary_color      = :primary_color,
                    secondary_color    = :secondary_color,
                    logo_path          = :logo_path,
                    legal_address      = :legal_address,
                    operative_address  = :operative_address
                WHERE tenant_id = :tid'
            );
        }
        else {
            $stmt = $this->db->prepare(
                'INSERT INTO societa_profile
                    (tenant_id, mission, vision, `values`, founded_year,
                     primary_color, secondary_color, logo_path, legal_address, operative_address)
                 VALUES
                    (:tid, :mission, :vision, :values, :founded_year,
                     :primary_color, :secondary_color, :logo_path, :legal_address, :operative_address)'
            );
        }

        $stmt->execute(array_merge($data, [':tid' => $tenantId]));
    }

    // ─── ROLES ────────────────────────────────────────────────────────────────

    public function listRoles(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_roles
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY sort_order ASC, name ASC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getRoleById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_roles WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createRole(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO societa_roles (id, tenant_id, name, description, permissions_json, parent_role_id, sort_order)
             VALUES (:id, :tenant_id, :name, :description, :permissions_json, :parent_role_id, :sort_order)'
        );
        $stmt->execute($data);
    }

    public function updateRole(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'UPDATE societa_roles SET
                name             = :name,
                description      = :description,
                permissions_json = :permissions_json,
                parent_role_id   = :parent_role_id,
                sort_order       = :sort_order
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute(array_merge($data, [':id' => $id, ':tid' => $tenantId]));
    }

    public function deleteRole(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE societa_roles SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    // ─── MEMBERS ──────────────────────────────────────────────────────────────

    public function listMembers(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT m.*, r.name AS role_name
             FROM societa_members m
             LEFT JOIN societa_roles r ON m.role_id = r.id
             WHERE m.tenant_id = :tid AND m.is_deleted = 0
             ORDER BY m.full_name ASC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getMemberById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT m.*, r.name AS role_name
             FROM societa_members m
             LEFT JOIN societa_roles r ON m.role_id = r.id
             WHERE m.id = :id AND m.tenant_id = :tid AND m.is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createMember(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO societa_members
                (id, tenant_id, user_id, role_id, full_name, email, phone, start_date, end_date, is_active, notes)
             VALUES
                (:id, :tenant_id, :user_id, :role_id, :full_name, :email, :phone, :start_date, :end_date, :is_active, :notes)'
        );
        $stmt->execute($data);
    }

    public function updateMember(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'UPDATE societa_members SET
                user_id    = :user_id,
                role_id    = :role_id,
                full_name  = :full_name,
                email      = :email,
                phone      = :phone,
                start_date = :start_date,
                end_date   = :end_date,
                is_active  = :is_active,
                notes      = :notes
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute(array_merge($data, [':id' => $id, ':tid' => $tenantId]));
    }

    public function updateMemberPhoto(string $id, ?string $photoPath): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE societa_members SET photo_path = :photo_path
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        )->execute([':photo_path' => $photoPath, ':id' => $id, ':tid' => $tenantId]);
    }

    public function deleteMember(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE societa_members SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    // ─── DOCUMENTS ────────────────────────────────────────────────────────────

    public function listDocuments(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_documents
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY uploaded_at DESC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getDocumentById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_documents WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function insertDocument(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO societa_documents (id, tenant_id, category, file_path, file_name, expiry_date, notes)
             VALUES (:id, :tenant_id, :category, :file_path, :file_name, :expiry_date, :notes)'
        );
        $stmt->execute($data);
    }

    public function deleteDocument(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE societa_documents SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    // ─── DEADLINES ────────────────────────────────────────────────────────────

    public function listDeadlines(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_deadlines
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY due_date ASC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getDeadlineById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_deadlines WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createDeadline(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO societa_deadlines (id, tenant_id, title, due_date, category, status, linked_document_id, notes)
             VALUES (:id, :tenant_id, :title, :due_date, :category, :status, :linked_document_id, :notes)'
        );
        $stmt->execute($data);
    }

    public function updateDeadline(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'UPDATE societa_deadlines SET
                title               = :title,
                due_date            = :due_date,
                category            = :category,
                status              = :status,
                linked_document_id  = :linked_document_id,
                notes               = :notes
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute(array_merge($data, [':id' => $id, ':tid' => $tenantId]));
    }

    public function deleteDeadline(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE societa_deadlines SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    // ─── SPONSORS ─────────────────────────────────────────────────────────────

    public function listSponsors(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_sponsors
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY sort_order ASC, name ASC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getSponsorById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_sponsors
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createSponsor(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO societa_sponsors
                (id, tenant_id, name, tipo, stagione, description, logo_path,
                 website_url, instagram_url, facebook_url, linkedin_url, tiktok_url,
                 importo, rapporto, sponsorizzazione,
                 sort_order, is_active)
             VALUES
                (:id, :tenant_id, :name, :tipo, :stagione, :description, :logo_path,
                 :website_url, :instagram_url, :facebook_url, :linkedin_url, :tiktok_url,
                 :importo, :rapporto, :sponsorizzazione,
                 :sort_order, :is_active)'
        );
        $stmt->execute($data);
    }

    public function updateSponsor(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'UPDATE societa_sponsors SET
                name             = :name,
                tipo             = :tipo,
                stagione         = :stagione,
                description      = :description,
                logo_path        = :logo_path,
                website_url      = :website_url,
                instagram_url    = :instagram_url,
                facebook_url     = :facebook_url,
                linkedin_url     = :linkedin_url,
                tiktok_url       = :tiktok_url,
                importo          = :importo,
                rapporto         = :rapporto,
                sponsorizzazione = :sponsorizzazione,
                sort_order       = :sort_order,
                is_active        = :is_active
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute(array_merge($data, [':id' => $id, ':tid' => $tenantId]));
    }

    public function updateSponsorLogo(string $id, string $logoPath): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE societa_sponsors SET logo_path = :logo_path
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        )->execute([':logo_path' => $logoPath, ':id' => $id, ':tid' => $tenantId]);
    }

    public function deleteSponsor(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE societa_sponsors SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    // ─── TITOLI ───────────────────────────────────────────────────────────────

    public function listTitoli(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_titoli
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY stagione DESC, campionato ASC, piazzamento ASC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getTitoloById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM societa_titoli WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createTitolo(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO societa_titoli
                (id, tenant_id, stagione, campionato, categoria, piazzamento, finali_nazionali, note)
             VALUES
                (:id, :tenant_id, :stagione, :campionato, :categoria, :piazzamento, :finali_nazionali, :note)'
        );
        $stmt->execute($data);
    }

    public function updateTitolo(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'UPDATE societa_titoli SET
                stagione          = :stagione,
                campionato        = :campionato,
                categoria         = :categoria,
                piazzamento       = :piazzamento,
                finali_nazionali  = :finali_nazionali,
                note              = :note
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute(array_merge($data, [':id' => $id, ':tid' => $tenantId]));
    }

    public function deleteTitolo(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE societa_titoli SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }
    // ─── FORESTERIA ────────────────────────────────────────────────────────────

    public function getForesteriaInfo(?string $tenantId = null): ?array
    {
        if ($tenantId) {
            $stmt = $this->db->prepare('SELECT * FROM foresteria_info WHERE tenant_id = :tid LIMIT 1');
            $stmt->execute([':tid' => $tenantId]);
        } else {
            // For public endpoint
            $stmt = $this->db->query('SELECT * FROM foresteria_info LIMIT 1');
        }
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function getForesteriaMedia(string $tenantId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM foresteria_media
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY uploaded_at DESC LIMIT 200'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getForesteriaExpenses(string $tenantId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM foresteria_expenses
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY expense_date DESC LIMIT 100'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function upsertForesteriaInfo(array $data): void
    {
        $this->db->prepare(
            'INSERT INTO foresteria_info (id, tenant_id, description)
             VALUES (:id, :tenant_id, :description)
             ON DUPLICATE KEY UPDATE description = VALUES(description)'
        )->execute($data);
    }

    public function insertForesteriaExpense(array $data): void
    {
        $this->db->prepare(
            'INSERT INTO foresteria_expenses
             (id, tenant_id, description, amount, category, expense_date, receipt_path, notes, created_by)
             VALUES (:id, :tenant_id, :description, :amount, :category, :expense_date, :receipt_path, :notes, :created_by)'
        )->execute($data);
    }

    public function deleteForesteriaExpense(string $id, string $tenantId): void
    {
        $this->db->prepare(
            'UPDATE foresteria_expenses SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    public function insertForesteriaMedia(array $data): void
    {
        $this->db->prepare(
            'INSERT INTO foresteria_media (id, tenant_id, type, file_path, title, description)
             VALUES (:id, :tenant_id, :type, :file_path, :title, :description)'
        )->execute($data);
    }

    public function deleteForesteriaMedia(string $id, string $tenantId): void
    {
        $this->db->prepare(
            'UPDATE foresteria_media SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }
}