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
        'readonly'   => 0,
        'atleta'     => 1,
        'operatore'  => 2,
        'operator'   => 2,
        'allenatore' => 3,
        'manager'    => 4,
        'social media manager' => 4,
        'admin'      => 5,
    ];

    /**
     * Initialize a secure session (call once at bootstrap).
     */
    public static function startSession(): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            $sessionName = getenv('SESSION_NAME') ?: 'fusion_session';
            session_name($sessionName);

            // Use a long-lasting session: 30 days (2592000 seconds)
            $sessionLifetime = 2592000;

            // Increase session lifetime on server (Garbage Collector)
            ini_set('session.gc_maxlifetime', (string)$sessionLifetime);
            ini_set('session.cookie_lifetime', (string)$sessionLifetime);

            // Isolate session storage if allowed (prevents automatic cleanup on shared hosting)
            $localSessionPath = __DIR__ . '/../sessions';
            if (is_dir($localSessionPath) && is_writable($localSessionPath)) {
                session_save_path($localSessionPath);
            }

            $isSecure = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || 
                        (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');

            session_set_cookie_params([
                'lifetime' => $sessionLifetime,
                'path' => '/',
                'domain' => '',
                'secure' => $isSecure,
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

        $perms = $user['permissions'] ?? [];
        $defaults = self::getDefaultPermissions($user['role'] ?? '');
        $perms = array_merge($defaults, $perms);

        // Deny-by-default: if still no permissions map is configured, block access
        if (empty($perms)) {
            error_log("[Auth] requireRead('{$module}'): user {$user['id']} has no permissions configured.");
            Response::error("Permessi non configurati per il modulo '{$module}'. Contatta l'amministratore.", 403);
        }

        $level = $perms[$module] ?? 'none';
        if ($level === 'none') {
            Response::error("Permessi insufficienti per il modulo '{$module}'", 403);
        }

        return $user;
    }

    public static function requireWrite(string $module): array
    {
        $user = self::requireAuth();

        // Admin bypasses module-level checks
        if (($user['role'] ?? '') === 'admin') {
            return $user;
        }

        $perms = $user['permissions'] ?? [];
        $defaults = self::getDefaultPermissions($user['role'] ?? '');
        $perms = array_merge($defaults, $perms);

        // Deny-by-default: if still no permissions map is configured, block access
        if (empty($perms)) {
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

        $perms = $user['permissions'] ?? [];
        $defaults = self::getDefaultPermissions($user['role'] ?? '');
        $perms = array_merge($defaults, $perms);

        $_SESSION['user'] = [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'fullName' => $user['full_name'],
            'tenant_id' => $user['tenantId'] ?? null,
            'parent_user_id' => $user['parent_user_id'] ?? null,
            'permissions' => $perms,
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

    /**
     * Define default module permissions per role dynamically (matching frontend rules).
     */
    public static function getDefaultPermissions(string $role): array
    {
        $base = [
            'athletes' => 'read',
            'athlete-profile' => 'read',
            'athlete-payments' => 'read',
            'athlete-metrics' => 'read',
            'athlete-documents' => 'read',
            'payments' => 'read',
            'biometrics' => 'read',
            'teams' => 'read',
            'results' => 'read',
            'results-matches' => 'read',
            'results-standings' => 'read',
            'transport' => 'read',
            'transport-drivers' => 'read',
            'transport-fleet' => 'read',
            'outseason' => 'read',
            'outseason-camps' => 'read',
            'outseason-tournaments' => 'read',
            'tournaments' => 'read',
            'social' => 'read',
            'social-analytics' => 'read',
            'social-gallery' => 'read',
            'finance' => 'read',
            'admin' => 'read',
            'admin-backup' => 'read',
            'admin-logs' => 'read',
            'users' => 'read',
            'utenti' => 'read',
            'tasks' => 'read',
            'staff' => 'read',
            'staff-documents' => 'read',
            'ecommerce' => 'read',
            'ecommerce-articles' => 'read',
            'ecommerce-orders' => 'read',
            'whatsapp-inbox' => 'read',
            'whatsapp-contacts' => 'read',
            'website' => 'read',
            'newsletter' => 'read',
            'societa' => 'read',
            'societa-identita' => 'read',
            'societa-organigramma' => 'read',
            'societa-membri' => 'read',
            'societa-documenti' => 'read',
            'societa-scadenze' => 'read',
            'societa-sponsor' => 'read',
            'societa-titoli' => 'read',
            'network' => 'read',
            'network-collaborazioni' => 'read',
            'network-prove' => 'read',
            'network-attivita' => 'read'
        ];

        if ($role === 'admin') {
            foreach ($base as $k => $v) {
                $base[$k] = 'write';
            }
            return $base;
        }

        if ($role === 'allenatore' || $role === 'operatore') {
            $base['finance'] = 'none';
            $base['admin'] = 'none';
            $base['admin-backup'] = 'none';
            $base['admin-logs'] = 'none';
        }

        if ($role === 'atleta') {
            $base['finance'] = 'none';
            $base['admin'] = 'none';
            $base['admin-backup'] = 'none';
            $base['admin-logs'] = 'none';
            $base['societa'] = 'none';
            $base['staff'] = 'none';
        }

        return $base;
    }
}