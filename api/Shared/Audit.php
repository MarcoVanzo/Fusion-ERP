<?php
/**
 * Audit Logger
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use PDOException;

class Audit
{
    /**
     * Log a write action to audit_logs.
     *
     * @param string      $action     INSERT | UPDATE | DELETE | LOGIN | LOGIN_FAILED
     * @param string      $tableName  Target table name
     * @param string|null $recordId   Primary key of affected record
     * @param array|null  $before     Snapshot before change
     * @param array|null  $after      Snapshot after change
     */
    public static function log(
        string $action,
        string $tableName,
        ?string $recordId = null,
        ?array $before = null,
        ?array $after = null,
        ?string $details = null
        ): void
    {
        try {
            $db = Database::getInstance();
            $user = Auth::user();
            $userId = $user['id'] ?? null;
            $ip = self::getClientIp();

            $id = 'AUD_' . bin2hex(random_bytes(4));

            // Determine event_type from action
            $eventType = self::resolveEventType($action);

            // Snapshot user context at log time
            $username = $user['fullName'] ?? $user['full_name'] ?? null;
            $role = $user['role'] ?? null;
            $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;
            $httpStatus = http_response_code() ?: 200;

            $stmt = $db->prepare(
                'INSERT INTO audit_logs
                    (id, user_id, username, role, action, event_type, table_name, record_id,
                     before_snapshot, after_snapshot, ip_address, user_agent, http_status, details)
                 VALUES
                    (:id, :user_id, :username, :role, :action, :event_type, :table_name, :record_id,
                     :before, :after, :ip, :user_agent, :http_status, :details)'
            );

            $stmt->execute([
                ':id' => $id,
                ':user_id' => $userId,
                ':username' => $username,
                ':role' => $role,
                ':action' => $action,
                ':event_type' => $eventType,
                ':table_name' => $tableName,
                ':record_id' => $recordId,
                ':before' => $before !== null ? json_encode($before) : null,
                ':after' => $after !== null ? json_encode($after) : null,
                ':ip' => $ip,
                ':user_agent' => $userAgent ? mb_substr($userAgent, 0, 512) : null,
                ':http_status' => $httpStatus,
                ':details' => $details,
            ]);
        }
        catch (PDOException $e) {
            // Audit failure should never break the main request — just log to error_log
            error_log('[AUDIT] Failed to write audit log: ' . $e->getMessage());
        }
    }

    /**
     * Map action names to event_type categories.
     */
    private static function resolveEventType(string $action): string
    {
        return match (strtoupper($action)) {
            'LOGIN'          => 'login',
            'LOGIN_FAILED'   => 'login',
            'LOGOUT'         => 'logout',
            'BACKUP'         => 'backup',
            'RESTORE'        => 'restore',
            'PASSWORD_RESET' => 'login',
            'ACCESS_DENIED'  => 'access_denied',
            'ERROR'          => 'error',
            default          => 'crud',
        };
    }

    /**
     * Get the real client IP for audit logging.
     *
     * Trust order depends on TRUSTED_PROXY env variable:
     *   - 'cloudflare': Trust CF-Connecting-IP first (set in .env when behind Cloudflare)
     *   - 'proxy':      Trust X-Forwarded-For first (standard reverse proxy)
     *   - (unset):      Trust only REMOTE_ADDR — cannot be spoofed by the client
     *
     * This mirrors the intentional behavior in AuthController::getClientIp() where
     * X-Forwarded-For is NOT trusted for rate-limiting to prevent spoofing.
     * For audit logs we allow a configurable level of trust.
     */
    private static function getClientIp(): string
    {
        $trustedProxy = strtolower(trim((string)(getenv('TRUSTED_PROXY') ?: '')));

        $candidates = ['0.0.0.0'];

        if ($trustedProxy === 'cloudflare') {
            $candidates = [
                $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '',
                $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
                $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            ];
        }
        elseif ($trustedProxy === 'proxy') {
            $candidates = [
                $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
                $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
            ];
        }
        else {
            // Default: REMOTE_ADDR only — immune to client-side spoofing
            $candidates = [$_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'];
        }

        foreach ($candidates as $ip) {
            $ip = trim(explode(',', $ip)[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }

        return '0.0.0.0';
    }
}