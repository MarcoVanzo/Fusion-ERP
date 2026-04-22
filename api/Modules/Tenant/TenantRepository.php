<?php
/**
 * Tenant Repository — DB queries for multi-tenant management
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tenant;

use FusionERP\Shared\Database;
use PDO;

class TenantRepository
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── Tenant CRUD ──────────────────────────────────────────────────────────

    public function createTenant(array $data): void
    {
        try {
            $stmt = $this->db->prepare(
                'INSERT INTO tenants (id, name, domain, is_active, created_at)
                 VALUES (:id, :name, :domain, 1, NOW())'
            );
            $stmt->execute($data);
        } catch (\Throwable $e) {
            error_log('[Tenant] createTenant failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public function getTenantById(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM tenants WHERE id = :id AND is_active = 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // ─── Settings ─────────────────────────────────────────────────────────────

    public function setSetting(string $tenantId, string $key, string $value): void
    {
        try {
            $stmt = $this->db->prepare(
                'INSERT INTO tenant_settings (tenant_id, setting_key, setting_value)
                 VALUES (:tid, :key, :val)
                 ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()'
            );
            $stmt->execute([':tid' => $tenantId, ':key' => $key, ':val' => $value]);
        } catch (\Throwable $e) {
            error_log('[Tenant] setSetting failed for key=' . $key . ': ' . $e->getMessage());
            throw $e;
        }
    }

    // ─── Members ──────────────────────────────────────────────────────────────

    public function addMember(string $tenantId, string $userId, array $roles): void
    {
        $rolesJson = json_encode($roles);
        $stmt = $this->db->prepare(
            'INSERT INTO tenant_users (tenant_id, user_id, roles, is_active, created_at)
             VALUES (:tid, :uid, :roles, 1, NOW())
             ON DUPLICATE KEY UPDATE roles = VALUES(roles), is_active = 1, updated_at = NOW()'
        );
        $stmt->execute([':tid' => $tenantId, ':uid' => $userId, ':roles' => $rolesJson]);
    }

    public function removeMember(string $tenantId, string $userId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE tenant_users SET is_active = 0, updated_at = NOW()
             WHERE tenant_id = :tid AND user_id = :uid'
        );
        $stmt->execute([':tid' => $tenantId, ':uid' => $userId]);
    }

    public function getMembers(string $tenantId): array
    {
        $stmt = $this->db->prepare(
            'SELECT tu.user_id, tu.roles, tu.is_active, tu.created_at,
                    u.email, u.full_name, u.role AS system_role, u.last_login_at
             FROM tenant_users tu
             JOIN users u ON u.id = tu.user_id
             WHERE tu.tenant_id = :tid AND tu.is_active = 1
             ORDER BY u.full_name ASC'
        );
        $stmt->execute([':tid' => $tenantId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON roles
        foreach ($rows as &$row) {
            $row['roles'] = json_decode($row['roles'], true) ?? [];
        }

        return $rows;
    }

    public function getMembership(string $tenantId, string $userId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM tenant_users WHERE tenant_id = :tid AND user_id = :uid AND is_active = 1'
        );
        $stmt->execute([':tid' => $tenantId, ':uid' => $userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($row) {
            $row['roles'] = json_decode($row['roles'], true) ?? [];
        }
        return $row ?: null;
    }

    public function getUserTenants(string $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT t.id, t.name, t.domain, tu.roles
             FROM tenant_users tu
             JOIN tenants t ON t.id = tu.tenant_id
             WHERE tu.user_id = :uid AND tu.is_active = 1 AND t.is_active = 1
             ORDER BY t.name ASC'
        );
        $stmt->execute([':uid' => $userId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($rows as &$row) {
            $row['roles'] = json_decode($row['roles'], true) ?? [];
        }

        return $rows;
    }

    // ─── User lookup ──────────────────────────────────────────────────────────

    public function findUserByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT id, email, full_name FROM users WHERE email = :email AND deleted_at IS NULL');
        $stmt->execute([':email' => $email]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }

    // ─── Invitations ──────────────────────────────────────────────────────────

    public function createInvite(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO tenant_invitations (id, tenant_id, email, roles, invited_by, status, created_at)
             VALUES (:id, :tenant_id, :email, :roles, :invited_by, \'pending\', NOW())'
        );
        $stmt->execute($data);
    }

    // ─── Usage / Plan Limits ──────────────────────────────────────────────────

    public function getUsage(string $tenantId): array
    {
        // Count active teams for this tenant
        $stmtTeams = $this->db->prepare(
            'SELECT COUNT(*) AS cnt FROM teams WHERE deleted_at IS NULL'
        );
        $stmtTeams->execute();
        $teams = (int)($stmtTeams->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);

        // Count active athletes
        $stmtAthletes = $this->db->prepare(
            'SELECT COUNT(*) AS cnt FROM athletes WHERE deleted_at IS NULL AND is_active = 1'
        );
        $stmtAthletes->execute();
        $athletes = (int)($stmtAthletes->fetch(PDO::FETCH_ASSOC)['cnt'] ?? 0);

        return [
            'teams' => $teams,
            'athletes' => $athletes,
        ];
    }
}