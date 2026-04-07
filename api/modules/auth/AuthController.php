<?php
/**
 * Auth Controller — Login, Logout, Register, Reset Password, Sub-users
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

        $attempts = $this->repo->countRecentAttempts($ip, $this->rateWindow);
        if ($attempts >= $this->rateMax) {
            Response::error("Troppi tentativi falliti. Riprova tra " . ($this->rateWindow / 60) . " minuti.", 429);
        }

        $dbUser = $this->repo->getUserByEmail($email);
        $dummyHash = '$2y$12$dummyhashusedtopreventtimingsttttttttttttttttttttttttt.';
        $hashToVerify = $dbUser ? $dbUser['pwd_hash'] : $dummyHash;
        $passwordCorrect = password_verify($pwd, $hashToVerify);

        if (!$dbUser || !$passwordCorrect) {
            $this->repo->logAttempt($ip, $email, false);
            Response::error('Credenziali non valide.', 401);
        }

        // Se l'utente non è attivo, controlliamo se è perché è stato disattivato.
        // Se last_login_at è null, significa che è al suo primo accesso ("Invitato") e quindi può accedere.
        if (!(bool)$dbUser['is_active'] && $dbUser['last_login_at'] !== null) {
            Response::error('Il tuo account è stato disattivato. Contatta l\'amministratore.', 403);
        }

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
            'permissions' => $dbUser['permissions'] ?? [],
            'parent_user_id' => $dbUser['parent_user_id'] ?? null
        ];

        Auth::setUser($payload);
        Audit::log('LOGIN', 'users', $dbUser['id'], null, ['ip' => $ip]);
        $payload['fullName'] = $payload['full_name'];
        Response::success($payload);
    }

    // ─── POST /api/?module=auth&action=logout ─────────────────────────────────
    public function logout(): void
    {
        $user = Auth::user();
        if ($user) { Audit::log('LOGOUT', 'users', $user['id']); }
        Auth::logout();
        Response::success(['message' => 'Logout effettuato con successo']);
    }

    public function me(): void
    {
        $user = Auth::requireAuth();
        Response::success($user);
    }

    public function resetPassword(): void
    {
        $user = Auth::requireAuth();
        $body = Response::jsonBody();
        $currentPwd = $body['currentPassword'] ?? '';
        $newPwd = $body['newPassword'] ?? '';

        if (strlen($newPwd) < 10) Response::error('Password troppo breve', 400);

        $dbUser = $this->repo->getUserByEmail($user['email']);
        if (!$dbUser || !password_verify($currentPwd, $dbUser['pwd_hash'])) {
            Response::error('Password attuale errata', 401);
        }

        $hash = password_hash($newPwd, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->repo->updatePasswordHash($user['id'], $hash);
        Audit::log('PASSWORD_RESET', 'users', $user['id']);
        Response::success(['message' => 'Password aggiornata']);
    }

    public function requestPasswordReset(): void
    {
        $body = Response::jsonBody();
        $email = strtolower(trim($body['email'] ?? ''));
        $user = $this->repo->getUserByEmail($email);
        if ($user) {
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));
            $this->repo->setPasswordResetToken($user['id'], $token, $expiresAt);
            $appUrl = rtrim(getenv('APP_URL') ?: 'https://www.fusionteamvolley.it/ERP', '/');
            $resetLink = $appUrl . "/?reset=" . $token;
            $subject = "Reimposta Password - Fusion ERP";
            $htmlBody = "<p>Ciao {$user['full_name']}, clicca qui per resettare la password: <a href=\"{$resetLink}\">Reset</a></p>";
            \FusionERP\Shared\Mailer::send($user['email'], $user['full_name'], $subject, $htmlBody);
        }
        Response::success(['message' => 'Se l\'email è valida riceverai un link.']);
    }

    public function confirmPasswordReset(): void
    {
        $body = Response::jsonBody();
        $token = $body['token'] ?? '';
        $newPwd = $body['newPassword'] ?? '';
        if (empty($token) || strlen($newPwd) < 10) Response::error('Dati non validi', 400);

        $user = $this->repo->getUserByResetToken($token);
        if (!$user) Response::error('Token non valido', 400);

        $hash = password_hash($newPwd, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->repo->setPasswordHash($user['id'], $hash);
        $this->repo->clearPasswordResetToken($user['id']);
        Response::success(['message' => 'Password aggiornata']);
    }

    public function createUser(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();
        Response::requireFields($body, ['email', 'full_name', 'role']);

        $tempPassword = bin2hex(random_bytes(10));
        $hash = password_hash($tempPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $email = strtolower(trim($body['email']));

        if ($this->repo->getUserByEmail($email) !== null) Response::error('Email già in uso', 400);

        $id = 'USR_' . bin2hex(random_bytes(4));
        $this->repo->createUser([
            'id' => $id,
            'email' => $email,
            'pwd_hash' => $hash,
            'role' => $body['role'],
            'full_name' => trim($body['full_name']),
            'phone' => $body['phone'] ?? null,
            'permissions_json' => $body['permissions_json'] ?? null
        ]);

        Response::success(['id' => $id, 'message' => 'Utente creato', 'tempPassword' => $tempPassword], 201);
    }

    public function listUsers(): void
    {
        Auth::requireRole('admin');
        $role = filter_input(INPUT_GET, 'role', FILTER_DEFAULT) ?? '';
        Response::success($this->repo->listUsers($role));
    }

    // ─── ATHLETE PORTAL: SUB-USERS ──────────────────────────────────────────

    public function inviteSubUser(): void
    {
        $user = Auth::requireAuth();
        if ($user['role'] !== 'atleta' && $user['role'] !== 'admin') Response::error('Solo per atleti o admin', 403);

        $body = Response::jsonBody();
        Response::requireFields($body, ['email', 'full_name']);

        $parentId = $user['id'];
        if ($user['role'] === 'admin') {
            if (empty($body['athlete_user_id'])) Response::error('athlete_user_id mancante per admin', 400);
            $parentId = $body['athlete_user_id'];
        }

        if ($this->repo->countSubUsers($parentId) >= 2) Response::error('Limite sub-utenti raggiunto', 400);

        $token = bin2hex(random_bytes(32));
        $this->repo->createInvitation([
            'parent_user_id' => $parentId,
            'email' => strtolower(trim($body['email'])),
            'full_name' => trim($body['full_name']),
            'token' => $token
        ]);

        // Mock mail for now, or use Mailer
        $appUrl = rtrim(getenv('APP_URL') ?: 'https://www.fusionteamvolley.it/ERP', '/');
        $link = $appUrl . "/?invite=" . $token;
        \FusionERP\Shared\Mailer::send($body['email'], $body['full_name'], "Invito Sotto-utente", "Link: $link");

        Response::success(['message' => 'Invito inviato']);
    }

    public function getSubUsers(): void
    {
        $user = Auth::requireAuth();
        if ($user['role'] !== 'atleta' && $user['role'] !== 'admin') Response::error('Accesso negato', 403);
        
        $parentId = $user['id'];
        if ($user['role'] === 'admin') {
            $parentId = filter_input(INPUT_GET, 'athlete_user_id', FILTER_DEFAULT);
            if (!$parentId) Response::error('athlete_user_id richiesto per admin', 400);
        }
        
        Response::success($this->repo->getSubUsers($parentId));
    }

    public function acceptSubUserInvitation(): void
    {
        $body = Response::jsonBody();
        $token = $body['token'] ?? '';
        $password = $body['password'] ?? '';

        if (empty($token) || empty($password)) Response::error('Dati mancanti', 400);

        $invite = $this->repo->getInvitationByToken($token);
        if (!$invite) Response::error('Invito non valido', 404);

        $newUserId = 'USR_' . bin2hex(random_bytes(4));
        $this->repo->createUser([
            'id' => $newUserId,
            'email' => $invite['email'],
            'pwd_hash' => password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]),
            'role' => 'atleta',
            'full_name' => $invite['full_name'],
            'phone' => null,
            'permissions_json' => null,
            'parent_user_id' => $invite['parent_user_id']
        ]);

        $this->repo->updateInvitationStatus($token, 'accepted');
        Response::success(['message' => 'Sotto-utente creato']);
    }

    public function health(): void
    {
        Response::success(['status' => 'ok']);
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────

    private function getClientIp(): string
    {
        return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
}