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

        if ($row) {
            // Decodifica JSON dei ruoli additivi se presente
            $row['permissions'] = $row['tenant_roles'] ? json_decode($row['tenant_roles'], true) : [];
        }

        return $row ?: null;
    }

    public function countRecentAttempts(string $ip, int $windowSeconds): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM login_attempts
             WHERE ip_address = :ip
               AND success = 0
               AND created_at >= DATE_SUB(NOW(), INTERVAL :window SECOND)'
        );
        $stmt->execute([':ip' => $ip, ':window' => $windowSeconds]);
        return (int)$stmt->fetchColumn();
    }

    public function logAttempt(string $ip, ?string $email, bool $success): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO login_attempts (ip_address, email, success) VALUES (:ip, :email, :success)'
        );
        $stmt->execute([':ip' => $ip, ':email' => $email, ':success' => (int)$success]);
    }

    public function updateLastLogin(string $userId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE users SET last_login_at = NOW() WHERE id = :id'
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

    public function listUsers(string $role = ''): array
    {
        $sql = 'SELECT id, email, role, full_name, phone, is_active, last_login_at, created_at
                FROM users WHERE deleted_at IS NULL';
        if ($role !== '') {
            $stmt = $this->db->prepare($sql . ' AND role = :role ORDER BY full_name');
            $stmt->execute([':role' => $role]);
        }
        else {
            $stmt = $this->db->prepare($sql . ' ORDER BY full_name');
            $stmt->execute();
        }
        return $stmt->fetchAll();
    }

    public function createUser(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO users (id, email, pwd_hash, role, full_name, phone, is_active)
             VALUES (:id, :email, :pwd_hash, :role, :full_name, :phone, 1)'
        );
        $stmt->execute([
            ':id' => $data['id'],
            ':email' => $data['email'],
            ':pwd_hash' => $data['pwd_hash'],
            ':role' => $data['role'],
            ':full_name' => $data['full_name'],
            ':phone' => $data['phone'] ?? null,
        ]);
    }

    public function deactivateUser(string $userId): void
    {
        $stmt = $this->db->prepare('UPDATE users SET deleted_at = NOW() WHERE id = :id');
        $stmt->execute([':id' => $userId]);
    }
}