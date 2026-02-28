<?php
/**
 * Auth Controller — Login, Logout, Register, Reset Password
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Auth;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;

class AuthController
{
    private AuthRepository $repo;
    private int $rateMax;
    private int $rateWindow;

    public function __construct()
    {
        $this->repo = new AuthRepository();
        $this->rateMax = (int)(getenv('RATE_LIMIT_MAX') ?: 5);
        $this->rateWindow = (int)(getenv('RATE_LIMIT_WINDOW') ?: 900); // 15 min
    }

    // ─── POST /api/?module=auth&action=login ──────────────────────────────────
    public function login(): void
    {
        // === MOCK MODE BYPASS ===
        $user = Auth::user(); // Gets mock admin user
        Auth::setUser($user);

        Response::success([
            'id' => $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
            'fullName' => $user['fullName'],
            'needsReset' => false,
        ]);
    }

    // ─── POST /api/?module=auth&action=logout ─────────────────────────────────
    public function logout(): void
    {
        $user = Auth::user();
        if ($user) {
            Audit::log('LOGOUT', 'users', $user['id']);
        }
        Auth::logout();
        Response::success(['message' => 'Logout effettuato con successo']);
    }

    // ─── POST /api/?module=auth&action=me ─────────────────────────────────────
    public function me(): void
    {
        $user = Auth::requireAuth();
        Response::success($user);
    }

    // ─── POST /api/?module=auth&action=resetPassword ──────────────────────────
    public function resetPassword(): void
    {
        $user = Auth::requireAuth();
        $body = Response::jsonBody();

        $currentPwd = $body['currentPassword'] ?? '';
        $newPwd = $body['newPassword'] ?? '';

        if (strlen($newPwd) < 10) {
            Response::error('La password deve essere di almeno 10 caratteri', 400);
        }

        // Verify current password
        $dbUser = $this->repo->getUserByEmail($user['email']);
        if (!$dbUser || !password_verify($currentPwd, $dbUser['pwd_hash'])) {
            Response::error('Password attuale non corretta', 401);
        }

        $hash = password_hash($newPwd, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->repo->updatePasswordHash($user['id'], $hash);

        Audit::log('PASSWORD_RESET', 'users', $user['id']);
        Response::success(['message' => 'Password aggiornata con successo']);
    }

    // ─── POST /api/?module=auth&action=createUser (admin only) ───────────────
    public function createUser(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();

        Response::requireFields($body, ['email', 'password', 'full_name', 'role']);

        $allowed = ['admin', 'manager', 'operator', 'readonly'];
        if (!in_array($body['role'], $allowed, true)) {
            Response::error('Ruolo non valido', 400);
        }

        if (strlen($body['password']) < 10) {
            Response::error('La password deve essere di almeno 10 caratteri', 400);
        }

        $id = 'USR_' . bin2hex(random_bytes(4));
        $hash = password_hash($body['password'], PASSWORD_BCRYPT, ['cost' => 12]);

        $this->repo->createUser([
            'id' => $id,
            'email' => strtolower(trim($body['email'])),
            'pwd_hash' => $hash,
            'role' => $body['role'],
            'full_name' => htmlspecialchars(trim($body['full_name']), ENT_QUOTES, 'UTF-8'),
            'phone' => $body['phone'] ?? null,
        ]);

        Audit::log('INSERT', 'users', $id, null, ['email' => $body['email'], 'role' => $body['role']]);
        Response::success(['id' => $id, 'message' => 'Utente creato con successo'], 201);
    }

    // ─── POST /api/?module=auth&action=listUsers (admin only) ────────────────
    public function listUsers(): void
    {
        Auth::requireRole('admin');
        $role = filter_input(INPUT_GET, 'role', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $users = $this->repo->listUsers($role);
        Response::success($users);
    }

    // ─── POST /api/?module=auth&action=deactivateUser (admin only) ───────────
    public function deactivateUser(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();
        $userId = $body['userId'] ?? '';

        if (empty($userId)) {
            Response::error('userId obbligatorio', 400);
        }

        $this->repo->deactivateUser($userId);
        Audit::log('DELETE', 'users', $userId);
        Response::success(['message' => 'Utente disattivato']);
    }

    private function getClientIp(): string
    {
        $ip = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return trim(explode(',', $ip)[0]);
    }
}