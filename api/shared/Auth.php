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
                'samesite' => 'Strict',
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
     * Set a user into the session after successful login.
     */
    public static function setUser(array $user): void
    {
        // Regenerate session ID to prevent session fixation
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'fullName' => $user['full_name'],
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