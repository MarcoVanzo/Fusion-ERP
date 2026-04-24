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

    public static function startSession(): void
    {
        // Session initialization is no longer needed with JWT, 
        // but we keep the method for compatibility.
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }

    public static function user(): ?array
    {
        if (isset($_COOKIE['auth_token'])) {
            $payload = \FusionERP\Shared\Security::validateJWT($_COOKIE['auth_token']);
            if ($payload) {
                return $payload['user_data'] ?? null;
            }
        }
        return null;
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
     */
    public static function requireRead(string $module): array
    {
        $user = self::requireAuth();

        if (($user['role'] ?? '') === 'admin') {
            return $user;
        }

        $perms = $user['permissions'] ?? [];
        $defaults = self::getDefaultPermissions($user['role'] ?? '');
        $perms = array_merge($defaults, $perms);

        if (empty($perms)) {
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

        if (($user['role'] ?? '') === 'admin') {
            return $user;
        }

        $perms = $user['permissions'] ?? [];
        $defaults = self::getDefaultPermissions($user['role'] ?? '');
        $perms = array_merge($defaults, $perms);

        if (empty($perms)) {
            Response::error("Permessi di scrittura non configurati per il modulo '{$module}'. Contatta l'amministratore.", 403);
        }

        $level = $perms[$module] ?? 'none';
        if ($level !== 'write') {
            Response::error("Permessi di scrittura insufficienti per il modulo '{$module}'", 403);
        }

        return $user;
    }

    /**
     * Set a user into the session (JWT cookie) after successful login.
     */
    public static function setUser(array $user): void
    {
        $perms = $user['permissions'] ?? [];
        $defaults = self::getDefaultPermissions($user['role'] ?? '');
        $perms = array_merge($defaults, $perms);

        $userData = [
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'fullName' => $user['full_name'],
            'tenant_id' => $user['tenant_id'] ?? null,
            'parent_user_id' => $user['parent_user_id'] ?? null,
            'permissions' => $perms,
        ];

        $token = \FusionERP\Shared\Security::generateJWT(['user_data' => $userData]);
        $isSecure = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || 
                    (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
        
        setcookie('auth_token', $token, [
            'expires' => time() + 86400 * 30, // 30 days
            'path' => '/',
            'domain' => '',
            'secure' => $isSecure,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    /**
     * Destroy the current session.
     */
    public static function logout(): void
    {
        setcookie('auth_token', '', [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => '',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
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
            'athlete-injuries' => 'read',
            'athlete-attendances' => 'read',
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
            'network-attivita' => 'read',
            // Moduli operativi (erano mancanti → 403 per tutti i non-admin)
            'health' => 'read',
            'federation' => 'read',
            'documents' => 'read',
            'scouting' => 'read',
            'vald' => 'read',
        ];

        if ($role === 'admin') {
            foreach ($base as $k => $v) {
                $base[$k] = 'write';
            }
            return $base;
        }

        if ($role === 'allenatore' || $role === 'operatore') {
            // Moduli operativi: allenatori e operatori devono poter scrivere
            $base['athletes'] = 'write';
            $base['athlete-profile'] = 'write';
            $base['athlete-payments'] = 'write';
            $base['athlete-metrics'] = 'write';
            $base['athlete-documents'] = 'write';
            $base['athlete-injuries'] = 'write';
            $base['athlete-attendances'] = 'write';
            $base['health'] = 'write';
            $base['tournaments'] = 'write';
            $base['transport'] = 'write';
            $base['transport-drivers'] = 'write';
            $base['transport-fleet'] = 'write';
            $base['biometrics'] = 'write';
            $base['vald'] = 'write';
            $base['tasks'] = 'write';
            $base['documents'] = 'write';
            $base['federation'] = 'write';
            $base['results'] = 'write';
            $base['results-matches'] = 'write';
            $base['outseason'] = 'write';
            $base['outseason-camps'] = 'write';
            $base['outseason-tournaments'] = 'write';
            $base['scouting'] = 'write';
            $base['staff'] = 'write';
            $base['staff-documents'] = 'write';
            // Blocca amministrazione e finanza
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