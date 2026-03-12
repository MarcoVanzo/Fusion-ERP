<?php
/**
 * Auth — Session & RBAC
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Shared;

class Auth
{
    // Role hierarchy: higher index = more permissions
    private const ROLE_LEVELS = [
        'readonly' => 0,
        'operator' => 1,
        'manager' => 2,
        'admin' => 3,
    ];

    /**
     * Initialize a secure session (call once at bootstrap).
     */
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            $sessionName = getenv('SESSION_NAME') ?: 'fusion_session';
            session_name($sessionName);

            session_set_cookie_params([
                'lifetime' => 0,
                'path' => '/',
                'domain' => '',
                'secure' => (getenv('APP_ENV') === 'production'),
                'httponly' => true,
                'samesite' => 'Lax',
            ]);

            session_start();
        }
    }

    public static function user(): ?array
    {
        self::startSession();
        return $_SESSION['user'] ?? null;
    }

    /**
     * Require that the user is authenticated (401 otherwise).
     */
    public static function requireAuth(): array
    {
        $user = self::user();
        if (!$user) {
            Response::error('Non autorizzato - Login necessario', 401);
        }
        return $user;
    }

    /**
     * Require minimum role (403 if insufficient).
     * Always reads role from SERVER-SIDE session, never from client.
     */
    public static function requireRole(string $minRole): array
    {
        $user = self::requireAuth();

        $userLevel = self::ROLE_LEVELS[$user['role']] ?? -1;
        $minLevel = self::ROLE_LEVELS[$minRole] ?? 999;

        if ($userLevel < $minLevel) {
            Response::error('Permessi insufficienti', 403);
        }

        return $user;
    }

    /**
     * Require at least READ permission on a module (403 if 'none').
     * Uses the permissions map stored in session: { 'athletes': 'write', 'social': 'none', ... }
     * Admin users bypass all module-level checks.
     *
     * @return array The authenticated user
     */
    public static function requireRead(string $module): array
    {
        $user = self::requireAuth();

        // Admin bypasses module-level checks
        if (($user['role'] ?? '') === 'admin') {
            return $user;
        }

        $perms = $user['permissions'] ?? null;
        // Deny-by-default: if no permissions map is configured, block access (fix M5)
        // This follows the principle of least privilege. Admins bypass this check above.
        // Ensure all non-admin users have their permissions configured in the DB.
        if (!$perms || !is_array($perms) || empty($perms)) {
            error_log("[Auth] requireRead('{$module}'): user {$user['id']} has no permissions configured.");
            Response::error("Permessi non configurati per il modulo '{$module}'. Contatta l'amministratore.", 403);
        }

        $level = $perms[$module] ?? 'none';
        if ($level === 'none') {
            Response::error("Permessi insufficienti per il modulo '{$module}'", 403);
        }

        return $user;
    }

    /**
     * Require WRITE permission on a module (403 if 'read' or 'none').
     * Uses the permissions map stored in session: { 'athletes': 'write', 'social': 'read', ... }
     * Admin users bypass all module-level checks.
     *
     * @return array The authenticated user
     */
    public static function requireWrite(string $module): array
    {
        $user = self::requireAuth();

        // Admin bypasses module-level checks
        if (($user['role'] ?? '') === 'admin') {
            return $user;
        }

        $perms = $user['permissions'] ?? null;
        // Deny-by-default: if no permissions map is configured, block access (fix M5)
        if (!$perms || !is_array($perms) || empty($perms)) {
            error_log("[Auth] requireWrite('{$module}'): user {$user['id']} has no permissions configured.");
            Response::error("Permessi di scrittura non configurati per il modulo '{$module}'. Contatta l'amministratore.", 403);
        }

        $level = $perms[$module] ?? 'none';
        if ($level !== 'write') {
            Response::error("Permessi di scrittura insufficienti per il modulo '{$module}'", 403);
        }

        return $user;
    }

    /**
     * Set a user into the session after successful login.
     */
    public static function setUser(array $user): void
    {
        // Regenerate session ID to prevent session fixation
        // Wrapped in try-catch to prevent 500 errors on restrictive shared hosting (Aruba)
        try {
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_regenerate_id(true);
            }
        } catch (\Throwable $e) {
            error_log('[Auth] session_regenerate_id failed: ' . $e->getMessage());
        }

        $_SESSION['user'] = [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'fullName' => $user['full_name'],
            'permissions' => $user['permissions'] ?? [],
        ];
    }

    /**
     * Destroy the current session.
     */
    public static function logout(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $p = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
        }
        session_destroy();
    }

    /**
     * Check if a password reset is required (>90 days since last change).
     */
    public static function isPasswordExpired(?string $passwordChangedAt): bool
    {
        if ($passwordChangedAt === null) {
            return true; // Never changed → force reset
        }
        $changed = new \DateTime($passwordChangedAt);
        $now = new \DateTime();
        $limitDuration = (int)(getenv('PASSWORD_EXPIRY_DAYS') ?: 90);
        return $changed->diff($now)->days > $limitDuration;
    }
}