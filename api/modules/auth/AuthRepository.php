<?php
/**
 * Auth Repository — DB Queries for Authentication
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Auth;

use FusionERP\Shared\Database;

class AuthRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getUserByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT u.id, u.email, u.pwd_hash, u.role, u.full_name, u.phone, u.is_active, u.deleted_at,
                    u.password_changed_at, u.last_login_at,
                    t.tenant_id, t.roles as tenant_roles
             FROM users u
             LEFT JOIN tenant_users t ON u.id = t.user_id
             WHERE u.email = :email AND u.deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $row = $stmt->fetch();
        $stmt->closeCursor();

        if ($row) {
            // Decodifica JSON dei ruoli additivi se presente
            $row['permissions'] = $row['tenant_roles'] ? json_decode($row['tenant_roles'], true) : [];
        }

        return $row ?: null;
    }

    public function emailExistsInTrash(string $email): bool
    {
        $stmt = $this->db->prepare(
            'SELECT 1 FROM users WHERE email = :email AND deleted_at IS NOT NULL LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $exists = (bool)$stmt->fetchColumn();
        $stmt->closeCursor();
        return $exists;
    }

    public function getDeletedUserByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, email, role, full_name, is_active FROM users WHERE email = :email AND deleted_at IS NOT NULL LIMIT 1'
        );
        $stmt->execute([':email' => $email]);
        $row = $stmt->fetch();
        $stmt->closeCursor();
        return $row ?: null;
    }

    public function restoreAndRewriteUser(string $id, array $data): void
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare(
                'UPDATE users 
                 SET deleted_at = NULL, pwd_hash = :pwd_hash, role = :role, 
                     full_name = :full_name, phone = :phone, is_active = 0, 
                     updated_at = NOW() 
                 WHERE id = :id'
            );
            $stmt->execute([
                ':id' => $id,
                ':pwd_hash' => $data['pwd_hash'],
                ':role' => $data['role'],
                ':full_name' => $data['full_name'],
                ':phone' => $data['phone'] ?? null,
            ]);

            $permissionsJson = '[]';
            if (isset($data['permissions_json']) && is_array($data['permissions_json']) && !empty($data['permissions_json'])) {
                $permissionsJson = json_encode($data['permissions_json']);
            }
            
            $stmtCheck = $this->db->prepare('SELECT 1 FROM tenant_users WHERE user_id = :id');
            $stmtCheck->execute([':id' => $id]);
            $defaultTenant = getenv('DEFAULT_TENANT_ID') ?: 'TNT_fusion';
            if ($stmtCheck->fetchColumn()) {
                $stmtUpdate = $this->db->prepare('UPDATE tenant_users SET roles = :perms WHERE user_id = :id');
                $stmtUpdate->execute([':perms' => $permissionsJson, ':id' => $id]);
            } else {
                $stmtInsert = $this->db->prepare('INSERT INTO tenant_users (user_id, tenant_id, roles) VALUES (:id, :tid, :perms)');
                $stmtInsert->execute([':id' => $id, ':tid' => $defaultTenant, ':perms' => $permissionsJson]);
            }

            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function countRecentAttempts(string $ip, int $windowSeconds): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM login_attempts
             WHERE ip_address = :ip
               AND success = 0
               AND created_at >= DATE_SUB(NOW(), INTERVAL :window SECOND)'
        );
        $stmt->bindValue(':ip', $ip, \PDO::PARAM_STR);
        $stmt->bindValue(':window', $windowSeconds, \PDO::PARAM_INT);
        $stmt->execute();
        $count = (int)$stmt->fetchColumn();
        $stmt->closeCursor();
        return $count;
    }

    public function logAttempt(string $ip, ?string $email, bool $success): void
    {
        $id = 'LGA_' . bin2hex(random_bytes(4));
        $stmt = $this->db->prepare(
            'INSERT INTO login_attempts (id, ip_address, email, success) VALUES (:id, :ip, :email, :success)'
        );
        $stmt->execute([':id' => $id, ':ip' => $ip, ':email' => $email, ':success' => (int)$success]);
    }

    public function updateLastLogin(string $userId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET last_login_at = NOW(), is_active = 1 WHERE id = :id'
        );
        $stmt->execute([':id' => $userId]);
    }

    public function updatePasswordHash(string $userId, string $hash): void
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET pwd_hash = :hash, password_changed_at = NOW() WHERE id = :id'
        );
        $stmt->execute([':hash' => $hash, ':id' => $userId]);
    }

    public function updateUserEmail(string $userId, string $email): void
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET email = :email, updated_at = NOW() WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([':email' => $email, ':id' => $userId]);
    }

    public function getUserById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, email, role, full_name, phone, is_active, last_login_at, created_at, parent_user_id
             FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch() ?: null;
        $stmt->closeCursor();
        return $row;
    }

    public function listUsers(string $role = ''): array
    {
        $sql = 'SELECT u.id, u.email, u.role, u.full_name, u.phone, u.is_active, u.last_login_at, u.created_at, u.parent_user_id, t.roles as tenant_roles
                FROM users u
                LEFT JOIN tenant_users t ON u.id = t.user_id
                WHERE u.deleted_at IS NULL';
        if ($role !== '') {
            $stmt = $this->db->prepare($sql . ' AND u.role = :role ORDER BY u.full_name');
            $stmt->execute([':role' => $role]);
        }
        else {
            $stmt = $this->db->prepare($sql . ' ORDER BY u.full_name');
            $stmt->execute();
        }
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['permissions_json'] = $row['tenant_roles'] ? json_decode($row['tenant_roles'], true) : null;
            unset($row['tenant_roles']);
            if ($row['is_active']) {
                $row['status'] = 'Attivo';
            } elseif ($row['last_login_at'] === null) {
                $row['status'] = 'Invitato';
            } else {
                $row['status'] = 'Disattivato';
            }
        }
        return $rows;
    }

    public function createUser(array $data): void
    {
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare(
                'INSERT INTO users (id, email, pwd_hash, role, full_name, phone, is_active, parent_user_id)
                 VALUES (:id, :email, :pwd_hash, :role, :full_name, :phone, 0, :parent_id)'
            );
            $stmt->execute([
                ':id' => $data['id'],
                ':email' => $data['email'],
                ':pwd_hash' => $data['pwd_hash'],
                ':role' => $data['role'],
                ':full_name' => $data['full_name'],
                ':phone' => $data['phone'] ?? null,
                ':parent_id' => $data['parent_user_id'] ?? null,
            ]);

            $permissionsJson = '[]';
            if (isset($data['permissions_json']) && is_array($data['permissions_json']) && !empty($data['permissions_json'])) {
                $permissionsJson = json_encode($data['permissions_json']);
            }
            
            $defaultTenant = getenv('DEFAULT_TENANT_ID') ?: 'TNT_fusion';
            $stmtInsert = $this->db->prepare(
                'INSERT INTO tenant_users (user_id, tenant_id, roles) VALUES (:id, :tid, :perms)'
            );
            $stmtInsert->execute([':id' => $data['id'], ':tid' => $defaultTenant, ':perms' => $permissionsJson]);

            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function deactivateUser(string $userId): void
    {
        $stmt = $this->db->prepare('UPDATE users SET deleted_at = NOW() WHERE id = :id');
        $stmt->execute([':id' => $userId]);
    }

    public function updateRole(string $id, string $role, ?array $permissions = null): void
    {
        try {
            $this->db->beginTransaction();
            $stmt = $this->db->prepare('UPDATE users SET role = :role, updated_at = NOW() WHERE id = :id AND deleted_at IS NULL');
            $stmt->execute([':role' => $role, ':id' => $id]);
            
            if ($permissions !== null) {
                $permsJson = json_encode($permissions);
                $defaultTenant = getenv('DEFAULT_TENANT_ID') ?: 'TNT_fusion';
                $stmtCheck = $this->db->prepare('SELECT 1 FROM tenant_users WHERE user_id = :id');
                $stmtCheck->execute([':id' => $id]);
                if ($stmtCheck->fetchColumn()) {
                    $stmtUpdate = $this->db->prepare('UPDATE tenant_users SET roles = :perms WHERE user_id = :id');
                    $stmtUpdate->execute([':perms' => $permsJson, ':id' => $id]);
                } else {
                    $stmtInsert = $this->db->prepare('INSERT INTO tenant_users (user_id, tenant_id, roles) VALUES (:id, :tid, :perms)');
                    $stmtInsert->execute([':id' => $id, ':tid' => $defaultTenant, ':perms' => $permsJson]);
                }
            }
            $this->db->commit();
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function toggleActive(string $id, bool $active): void
    {
        $stmt = $this->db->prepare('UPDATE users SET is_active = :active, updated_at = NOW() WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute([':active' => (int)$active, ':id' => $id]);
    }

    public function setPasswordHash(string $id, string $hash): void
    {
        $stmt = $this->db->prepare('UPDATE users SET pwd_hash = :hash, password_changed_at = NOW(), updated_at = NOW() WHERE id = :id AND deleted_at IS NULL');
        $stmt->execute([':hash' => $hash, ':id' => $id]);
    }

    public function getRecentPasswordHashes(string $userId, int $limit = 3): array
    {
        $stmt = $this->db->prepare(
            'SELECT pwd_hash FROM password_history
             WHERE user_id = :user_id
             ORDER BY created_at DESC
             LIMIT :limit'
        );
        $stmt->bindValue(':user_id', $userId, \PDO::PARAM_STR);
        $stmt->bindValue(':limit', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_COLUMN);
    }

    public function insertPasswordHistory(string $userId, string $hash): void
    {
        $id = 'PHS_' . bin2hex(random_bytes(4));
        $stmt = $this->db->prepare(
            'INSERT INTO password_history (id, user_id, pwd_hash)
             VALUES (:id, :user_id, :pwd_hash)'
        );
        $stmt->execute([
            ':id' => $id,
            ':user_id' => $userId,
            ':pwd_hash' => $hash
        ]);
    }

    public function setPasswordResetToken(string $userId, string $token, string $expiresAt): void
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET password_reset_token = :token, password_reset_expires_at = :expires_at, updated_at = NOW()
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([
            ':token' => $token,
            ':expires_at' => $expiresAt,
            ':id' => $userId
        ]);
    }

    public function getUserByResetToken(string $token): ?array
    {
        // Add check to ensure the token is not expired
        $stmt = $this->db->prepare(
            'SELECT id, email, role, full_name, phone, is_active, last_login_at, created_at
             FROM users
             WHERE password_reset_token = :token
               AND password_reset_expires_at > NOW()
               AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([':token' => $token]);
        $row = $stmt->fetch() ?: null;
        $stmt->closeCursor();
        return $row;
    }

    public function clearPasswordResetToken(string $userId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET password_reset_token = NULL, password_reset_expires_at = NULL, updated_at = NOW()
             WHERE id = :id'
        );
        $stmt->execute([':id' => $userId]);
    }

    /**
     * Sub-users & Invitations
     */

    public function countSubUsers(string $parentId): int
    {
        $stmt = $this->db->prepare('SELECT COUNT(*) FROM users WHERE parent_user_id = :parent_id AND deleted_at IS NULL');
        $stmt->execute([':parent_id' => $parentId]);
        return (int)$stmt->fetchColumn();
    }

    public function createInvitation(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO user_invitations (id, inviter_user_id, email, token, status, expires_at)
             VALUES (:id, :inviter_id, :email, :token, \'pending\', :expires_at)'
        );
        $stmt->execute([
            ':id' => 'INV_' . bin2hex(random_bytes(4)),
            ':inviter_id' => $data['inviter_id'],
            ':email' => $data['email'],
            ':token' => $data['token'],
            ':expires_at' => $data['expires_at']
        ]);
    }

    public function getInvitationByToken(string $token): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM user_invitations WHERE token = :token AND status = \'pending\' AND expires_at > NOW() LIMIT 1'
        );
        $stmt->execute([':token' => $token]);
        return $stmt->fetch() ?: null;
    }

    public function updateInvitationStatus(string $id, string $status): void
    {
        $stmt = $this->db->prepare('UPDATE user_invitations SET status = :status WHERE id = :id');
        $stmt->execute([':status' => $status, ':id' => $id]);
    }

    public function getSubUsers(string $parentId): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, email, full_name, is_active, created_at FROM users 
             WHERE parent_user_id = :parent_id AND deleted_at IS NULL'
        );
        $stmt->execute([':parent_id' => $parentId]);
        return $stmt->fetchAll();
    }
}