<?php
/**
 * TenantContext — Multi-Tenant Resolution Middleware
 * Fusion ERP v1.0
 *
 * Resolves the current tenant from session, subdomain, or header.
 * Provides tenant scoping helpers for all queries.
 */

declare(strict_types=1);

namespace FusionERP\Shared;

use PDO;

class TenantContext
{
    private static ?string $tenantId = null;
    private static ?array $tenant = null;
    /** @var array<string,string|null>|null Cached settings (1 query/request) */
    private static ?array $settingsCache = null;

    /**
     * Resolve and cache the current tenant.
     * Priority: 1) Session  2) X-Tenant-ID header  3) Subdomain  4) Default
     */
    public static function resolve(): string
    {
        if (self::$tenantId !== null) {
            return self::$tenantId;
        }

        // 1. From authenticated session (set at login)
        $user = Auth::user();
        if ($user && !empty($user['tenant_id'])) {
            self::$tenantId = $user['tenant_id'];
            return self::$tenantId;
        }

        // 2. From explicit header (for API integrations)
        $headerTenant = $_SERVER['HTTP_X_TENANT_ID'] ?? '';
        if (!empty($headerTenant) && self::isValidTenantId($headerTenant)) {
            self::$tenantId = $headerTenant;
            return self::$tenantId;
        }

        // 3. From subdomain (e.g., virtus.fusionerp.it)
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $subdomain = self::extractSubdomain($host);
        if ($subdomain) {
            $db = Database::getInstance();
            $stmt = $db->prepare('SELECT id FROM tenants WHERE domain = :domain AND is_active = 1 LIMIT 1');
            $stmt->execute([':domain' => $host]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($row) {
                self::$tenantId = $row['id'];
                return self::$tenantId;
            }
        }

        // 4. Fallback: default tenant (checks getenv, $_SERVER, $_ENV)
        $default = getenv('DEFAULT_TENANT_ID') ?: ($_SERVER['DEFAULT_TENANT_ID'] ?? ($_ENV['DEFAULT_TENANT_ID'] ?? 'TNT_fusion'));
        self::$tenantId = $default;

        // Log resolution in debug mode to help trace "empty tab" issues
        if (getenv('APP_DEBUG') === 'true') {
            error_log("[TenantContext] Resolved to '{$default}' (Source: Fallback)");
        }

        return self::$tenantId;
    }

    /**
     * Get current tenant ID (resolve if needed).
     */
    public static function id(): string
    {
        return self::resolve();
    }

    /**
     * Get full tenant record (cached).
     */
    public static function get(): ?array
    {
        if (self::$tenant !== null) {
            return self::$tenant;
        }

        $db = Database::getInstance();
        $stmt = $db->prepare('SELECT * FROM tenants WHERE id = :id AND is_active = 1 LIMIT 1');
        $stmt->execute([':id' => self::id()]);
        self::$tenant = $stmt->fetch(PDO::FETCH_ASSOC) ?: null;

        return self::$tenant;
    }

    /**
     * Get a specific tenant setting.
     * Results are cached after the first call (1 DB query per request). — fix A4
     */
    public static function setting(string $key, ?string $default = null): ?string
    {
        // Lazy-load all settings at once and cache for the lifetime of this request
        if (self::$settingsCache === null) {
            self::$settingsCache = self::allSettings();
        }
        return self::$settingsCache[$key] ?? $default;
    }

    /**
     * Set a tenant setting (upsert).
     */
    public static function setSetting(string $key, ?string $value): void
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            'INSERT INTO tenant_settings (tenant_id, setting_key, setting_value)
             VALUES (:tid, :key, :val)
             ON DUPLICATE KEY UPDATE setting_value = :val2'
        );
        $stmt->execute([
            ':tid' => self::id(),
            ':key' => $key,
            ':val' => $value,
            ':val2' => $value,
        ]);
    }

    /**
     * Get all settings for the current tenant.
     */
    public static function allSettings(): array
    {
        $db = Database::getInstance();
        $stmt = $db->prepare(
            'SELECT setting_key, setting_value FROM tenant_settings WHERE tenant_id = :tid'
        );
        $stmt->execute([':tid' => self::id()]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $result = [];
        foreach ($rows as $row) {
            $result[$row['setting_key']] = $row['setting_value'];
        }
        return $result;
    }

    /**
     * Override tenant (for testing or admin impersonation).
     */
    public static function setOverride(string $tenantId): void
    {
        self::$tenantId = $tenantId;
        self::$tenant = null; // force re-fetch
    }

    /**
     * Reset cached state (for testing).
     */
    public static function reset(): void
    {
        self::$tenantId = null;
        self::$tenant = null;
        self::$settingsCache = null; // also invalidate settings cache
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private static function extractSubdomain(string $host): ?string
    {
        // Remove port
        $host = explode(':', $host)[0];

        // Expected: xxx.fusionerp.it or xxx.fusionteamvolley.it
        $baseDomains = ['fusionerp.it', 'fusionteamvolley.it'];
        foreach ($baseDomains as $base) {
            if (str_ends_with($host, '.' . $base) && $host !== $base) {
                return str_replace('.' . $base, '', $host);
            }
        }

        return null;
    }

    private static function isValidTenantId(string $id): bool
    {
        return (bool)preg_match('/^TNT_[a-zA-Z0-9_]+$/', $id);
    }
}