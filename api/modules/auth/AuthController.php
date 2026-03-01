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
        $body = Response::jsonBody();
        $email = strtolower(trim($body['email'] ?? ''));
        $pwd = $body['password'] ?? '';
        $ip = $this->getClientIp();

        if (empty($email) || empty($pwd)) {
            Response::error('Email e password sono obbligatori.', 400);
        }

        // Check rate limiting
        $attempts = $this->repo->countRecentAttempts($ip, $this->rateWindow);
        if ($attempts >= $this->rateMax) {
            Response::error("Troppi tentativi falliti. Riprova tra " . ($this->rateWindow / 60) . " minuti.", 429);
        }

        $dbUser = $this->repo->getUserByEmail($email);

        // Always run password_verify to prevent user-enumeration via timing attack:
        // response time is identical whether the email doesn't exist or the password is wrong.
        $dummyHash = '$2y$12$dummyhashusedtopreventtimingsttttttttttttttttttttttttt.';
        $hashToVerify = $dbUser ? $dbUser['pwd_hash'] : $dummyHash;
        $passwordCorrect = password_verify($pwd, $hashToVerify);

        if (!$dbUser || !$passwordCorrect) {
            $this->repo->logAttempt($ip, $email, false);
            Response::error('Credenziali non valide.', 401);
        }

        if (!(bool)$dbUser['is_active']) {
            $this->repo->logAttempt($ip, $email, false);
            Response::error('Il tuo account è stato disattivato. Contatta l\'amministratore.', 403);
        }

        // Successo
        $this->repo->logAttempt($ip, $email, true);
        $this->repo->updateLastLogin($dbUser['id']);

        $needsReset = Auth::isPasswordExpired($dbUser['password_changed_at'] ?? null);

        $payload = [
            'id' => $dbUser['id'],
            'email' => $dbUser['email'],
            'role' => $dbUser['role'],
            'full_name' => $dbUser['full_name'],
            'needsReset' => $needsReset,
            'tenantId' => $dbUser['tenant_id'] ?? null,
            'permissions' => $dbUser['permissions'] ?? []
        ];

        Auth::setUser($payload);
        Audit::log('LOGIN', 'users', $dbUser['id'], null, ['ip' => $ip]);

        // Translate payload to match frontend expectations (fullName vs full_name is handled by frontend or here)
        $payload['fullName'] = $payload['full_name'];

        Response::success($payload);
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

    // ─── POST /api/?module=auth&action=updateUserRole (admin only) ────────────
    public function updateUserRole(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();
        Response::requireFields($body, ['userId', 'role']);

        $allowed = ['admin', 'manager', 'operator', 'readonly'];
        if (!in_array($body['role'], $allowed, true)) {
            Response::error('Ruolo non valido. Valori accettati: ' . implode(', ', $allowed), 400);
        }

        $userId = (string)$body['userId'];

        // Validate user exists
        $this->validateUserExists($userId);

        $this->repo->updateRole($userId, $body['role']);
        Audit::log('UPDATE', 'users', $userId, null, ['role' => $body['role']]);
        Response::success(['message' => 'Ruolo aggiornato']);
    }

    // ─── POST /api/?module=auth&action=toggleUserActive (admin only) ──────────
    public function toggleUserActive(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();
        Response::requireFields($body, ['userId', 'active']);

        $userId = (string)$body['userId'];
        $active = (bool)$body['active'];

        $this->validateUserExists($userId);

        $this->repo->toggleActive($userId, $active);
        Audit::log('UPDATE', 'users', $userId, null, ['is_active' => $active]);
        Response::success(['message' => $active ? 'Utente riattivato' : 'Utente sospeso']);
    }

    // ─── POST /api/?module=auth&action=adminResetPassword (admin only) ────────
    public function adminResetPassword(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();
        Response::requireFields($body, ['userId']);

        $userId = (string)$body['userId'];
        $this->validateUserExists($userId);

        // Generate cryptographically secure temporary password
        $tempPassword = bin2hex(random_bytes(10)); // 20 hex chars
        $hash = password_hash($tempPassword, PASSWORD_BCRYPT, ['cost' => 12]);

        $this->repo->setPasswordHash($userId, $hash);
        Audit::log('PASSWORD_RESET', 'users', $userId, null, ['reset_by' => 'admin']);

        // Return temp password plaintext ONLY in this response
        Response::success([
            'tempPassword' => $tempPassword,
            'message' => 'Password temporanea generata. Mostrala all\'utente e invitalo a cambiarla al prossimo accesso.',
        ]);
    }

    // ─── PRIVATE HELPER ───────────────────────────────────────────────────────
    private function validateUserExists(string $userId): array
    {
        $user = $this->repo->getUserById($userId);
        if (!$user) {
            Response::error('Utente non trovato', 404);
        }
        return $user;
    }

    private function getClientIp(): string
    {
        // Linea guida: Non fidarsi dell'X-Forwarded-For per rate-limiting se non dietro proxy certificato.
        // Proxy spoofing vanificherebbe il brute-force protection.
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return trim($ip);
    }
}