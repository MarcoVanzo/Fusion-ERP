<?php
/**
 * Staff Repository — DB queries for staff_members table
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Staff;

// Explicit require_once needed because server uses optimized classmap autoloader
$_staffShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_staffShared . 'TenantContext.php';
unset($_staffShared);

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

class StaffRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    // ─── List all active staff members ────────────────────────────────────────
    public function listStaff(): array
    {
        $tenantId = TenantContext::id();
        $sql = "SELECT id, first_name, last_name,
                       CONCAT(first_name, ' ', last_name) AS full_name,
                       role, phone, email, medical_cert_expires_at
                FROM staff_members
                WHERE tenant_id = :tenant_id AND is_deleted = 0
                ORDER BY last_name ASC, first_name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':tenant_id' => $tenantId]);
        return $stmt->fetchAll();
    }

    // ─── Get single staff member by ID ────────────────────────────────────────
    public function getById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $sql = "SELECT *, CONCAT(first_name, ' ', last_name) AS full_name
                FROM staff_members
                WHERE id = :id AND tenant_id = :tenant_id AND is_deleted = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id, ':tenant_id' => $tenantId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    // ─── Create ───────────────────────────────────────────────────────────────
    public function create(array $data): void
    {
        $sql = "INSERT INTO staff_members
                    (id, tenant_id, first_name, last_name, role,
                     birth_date, birth_place, residence_address, residence_city,
                     phone, email, fiscal_code, identity_document,
                     medical_cert_expires_at, notes)
                VALUES
                    (:id, :tenant_id, :first_name, :last_name, :role,
                     :birth_date, :birth_place, :residence_address, :residence_city,
                     :phone, :email, :fiscal_code, :identity_document,
                     :medical_cert_expires_at, :notes)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    public function update(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $sql = "UPDATE staff_members SET
                    first_name              = :first_name,
                    last_name               = :last_name,
                    role                    = :role,
                    birth_date              = :birth_date,
                    birth_place             = :birth_place,
                    residence_address       = :residence_address,
                    residence_city          = :residence_city,
                    phone                   = :phone,
                    email                   = :email,
                    fiscal_code             = :fiscal_code,
                    identity_document       = :identity_document,
                    medical_cert_expires_at = :medical_cert_expires_at,
                    notes                   = :notes
                WHERE id = :id AND tenant_id = :tenant_id AND is_deleted = 0";
        $stmt = $this->db->prepare($sql);
        $stmt->execute(array_merge($data, [':id' => $id, ':tenant_id' => $tenantId]));
    }

    // ─── Soft Delete ──────────────────────────────────────────────────────────
    public function softDelete(string $id): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare("UPDATE staff_members SET is_deleted = 1 WHERE id = :id AND tenant_id = :tenant_id");
        $stmt->execute([':id' => $id, ':tenant_id' => $tenantId]);
    }
}