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
        ?array $after = null
        ): void
    {
        try {
            $db = Database::getInstance();
            $user = Auth::user();
            $userId = $user['id'] ?? null;
            $ip = self::getClientIp();

            $stmt = $db->prepare(
                'INSERT INTO audit_logs (user_id, action, table_name, record_id, before_snapshot, after_snapshot, ip_address)
                 VALUES (:user_id, :action, :table_name, :record_id, :before, :after, :ip)'
            );

            $stmt->execute([
                ':user_id' => $userId,
                ':action' => $action,
                ':table_name' => $tableName,
                ':record_id' => $recordId,
                ':before' => $before !== null ? json_encode($before) : null,
                ':after' => $after !== null ? json_encode($after) : null,
                ':ip' => $ip,
            ]);
        }
        catch (PDOException $e) {
            // Audit failure should never break the main request — just log to error_log
            error_log('[AUDIT] Failed to write audit log: ' . $e->getMessage());
        }
    }

    /**
     * Get the real client IP (respects X-Forwarded-For for proxies).
     */
    private static function getClientIp(): string
    {
        $candidates = [
            $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '', // Cloudflare
            $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '',
            $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0',
        ];

        foreach ($candidates as $ip) {
            $ip = trim(explode(',', $ip)[0]);
            if (filter_var($ip, FILTER_VALIDATE_IP)) {
                return $ip;
            }
        }

        return '0.0.0.0';
    }
}