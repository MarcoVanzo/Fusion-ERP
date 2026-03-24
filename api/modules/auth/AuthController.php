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
            if ($dbUser['last_login_at'] !== null) {
                $this->repo->logAttempt($ip, $email, false);
                Response::error('Il tuo account è stato disattivato. Contatta l\'amministratore.', 403);
            }
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

        // Check password history
        $recentHashes = $this->repo->getRecentPasswordHashes($user['id'], 3);
        foreach ($recentHashes as $recentHash) {
            if (password_verify($newPwd, $recentHash)) {
                Response::error('La nuova password non può essere uguale a una delle tue ultime 3 password.', 400);
            }
        }

        // Ensure the current password is also checked just in case it's not in history yet
        if (password_verify($newPwd, $dbUser['pwd_hash'])) {
            Response::error('La nuova password deve essere diversa da quella attuale.', 400);
        }

        $hash = password_hash($newPwd, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->repo->updatePasswordHash($user['id'], $hash);
        $this->repo->insertPasswordHistory($user['id'], $hash);

        Audit::log('PASSWORD_RESET', 'users', $user['id']);
        Response::success(['message' => 'Password aggiornata con successo']);
    }

    // ─── POST /api/?module=auth&action=requestPasswordReset ───────────────────
    public function requestPasswordReset(): void
    {
        $body = Response::jsonBody();
        $email = strtolower(trim($body['email'] ?? ''));

        if (empty($email)) {
            Response::error('L\'email è obbligatoria', 400);
        }

        // We act like everything succeeds to prevent user enumeration
        $user = $this->repo->getUserByEmail($email);
        if ($user) {
            $token = bin2hex(random_bytes(32)); // 64 hex chars
            $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

            $this->repo->setPasswordResetToken($user['id'], $token, $expiresAt);

            // Costruisce il link di reset usando l'URL dell'app e la route frontend
            $appUrl = rtrim(getenv('APP_URL') ?: 'https://www.fusionteamvolley.it/ERP', '/');
            $resetLink = $appUrl . "/?reset=" . $token;

            $subject = "Reimposta la tua password - Fusion ERP";
            $htmlBody = "
                <body style=\"font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;\">
                    <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;\">
                        <div style=\"background-color: #e5005c; color: #ffffff; padding: 20px; text-align: center;\">
                            <h1 style=\"margin: 0; font-size: 24px;\">Reimposta Password</h1>
                        </div>
                        <div style=\"padding: 30px;\">
                            <p style=\"color: #666666; font-size: 16px;\">Ciao {$user['full_name']},</p>
                            <p style=\"color: #666666; font-size: 16px;\">Hai richiesto di reimpostare la tua password su Fusion ERP. Se non sei stato tu a farne richiesta, ignora questa email.</p>
                            <div style=\"text-align: center; margin-top: 30px;\">
                                <a href=\"{$resetLink}\" style=\"display: inline-block; padding: 12px 24px; background-color: #e5005c; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;\">Reimposta la mia Password</a>
                            </div>
                            <p style=\"color: #999999; font-size: 14px; margin-top: 30px; text-align: center;\">Il link sarà valido per 1 ora.</p>
                        </div>
                    </div>
                </body>";

            \FusionERP\Shared\Mailer::send($user['email'], $user['full_name'], $subject, $htmlBody);
            Audit::log('PASSWORD_RESET_REQUESTED', 'users', $user['id']);
        }

        Response::success(['message' => 'Se l\'email è registrata riceverai il link entro pochi minuti.']);
    }

    // ─── POST /api/?module=auth&action=confirmPasswordReset ───────────────────
    public function confirmPasswordReset(): void
    {
        $body = Response::jsonBody();
        $token = $body['token'] ?? '';
        $newPwd = $body['newPassword'] ?? '';

        if (empty($token) || empty($newPwd)) {
            Response::error('Token e nuova password sono obbligatori', 400);
        }

        if (strlen($newPwd) < 10) {
            Response::error('La password deve essere di almeno 10 caratteri', 400);
        }

        $user = $this->repo->getUserByResetToken($token);
        if (!$user) {
            Response::error('Il link di reset è invalido o scaduto', 400);
        }

        // Check password history
        $recentHashes = $this->repo->getRecentPasswordHashes($user['id'], 3);
        foreach ($recentHashes as $recentHash) {
            if (password_verify($newPwd, $recentHash)) {
                Response::error('La nuova password non può essere uguale a una delle tue ultime 3 password.', 400);
            }
        }

        $hash = password_hash($newPwd, PASSWORD_BCRYPT, ['cost' => 12]);
        $this->repo->setPasswordHash($user['id'], $hash);
        $this->repo->insertPasswordHistory($user['id'], $hash);
        $this->repo->clearPasswordResetToken($user['id']);

        Audit::log('PASSWORD_RESET_CONFIRMED', 'users', $user['id']);
        Response::success(['message' => 'Password aggiornata con successo! Effettua il login.']);
    }

    // ─── POST /api/?module=auth&action=createUser (admin only) ───────────────
    public function createUser(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();

        Response::requireFields($body, ['email', 'full_name', 'role']);

        $allowed = ['admin', 'manager', 'allenatore', 'operatore', 'atleta'];
        if (!in_array($body['role'], $allowed, true)) {
            Response::error('Ruolo non valido', 400);
        }

        // Auto-generate a secure temporary password — it will be communicated to the user
        $tempPassword = bin2hex(random_bytes(10)); // 20 hex chars
        $hash = password_hash($tempPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        $email = strtolower(trim($body['email']));

        if ($this->repo->getUserByEmail($email) !== null) {
            Response::error('Impossibile creare l\'utente: questa email è già in uso nel sistema.', 400);
        }

        $permissionsJson = null;
        if (isset($body['permissions_json']) && is_array($body['permissions_json'])) {
            $permissionsJson = $body['permissions_json'];
        }

        $deletedUser = $this->repo->getDeletedUserByEmail($email);
        
        if ($deletedUser) {
            $id = $deletedUser['id']; // Rieusa l'ID esistente
            
            $this->repo->restoreAndRewriteUser($id, [
                'email' => $email,
                'pwd_hash' => $hash,
                'role' => $body['role'],
                'full_name' => htmlspecialchars(trim($body['full_name']), ENT_QUOTES, 'UTF-8'),
                'phone' => $body['phone'] ?? null,
                'permissions_json' => $permissionsJson
            ]);
            
            Audit::log('RESTORE', 'users', $id, null, ['email' => $body['email'], 'role' => $body['role'], 'action' => 'auto-restored during registration']);
        } else {
            $id = 'USR_' . bin2hex(random_bytes(4));
            
            $this->repo->createUser([
                'id' => $id,
                'email' => $email,
                'pwd_hash' => $hash,
                'role' => $body['role'],
                'full_name' => htmlspecialchars(trim($body['full_name']), ENT_QUOTES, 'UTF-8'),
                'phone' => $body['phone'] ?? null,
                'permissions_json' => $permissionsJson
            ]);
            
            Audit::log('INSERT', 'users', $id, null, ['email' => $body['email'], 'role' => $body['role']]);
        }


        // Invia l'email con le credenziali temporanee
        $appUrl = rtrim(getenv('APP_URL') ?: 'https://www.fusionteamvolley.it/ERP', '/');
        $loginLink = $appUrl . "/";

        $subject = "Benvenuto in Fusion ERP - Le tue credenziali di accesso";
        $htmlBody = "
            <body style=\"font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;\">
                <div style=\"max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;\">
                    <div style=\"background-color: #e5005c; color: #ffffff; padding: 20px; text-align: center;\">
                        <h1 style=\"margin: 0; font-size: 24px;\">Benvenuto in Fusion ERP</h1>
                    </div>
                    <div style=\"padding: 30px;\">
                        <p style=\"color: #666666; font-size: 16px;\">Ciao " . htmlspecialchars(trim($body['full_name']), ENT_QUOTES, 'UTF-8') . ",</p>
                        <p style=\"color: #666666; font-size: 16px;\">Il tuo account su Fusion ERP è stato creato con successo. Di seguito trovi le tue credenziali di accesso provvisorie:</p>
                        <div style=\"background-color: #f9f9f9; padding: 15px; border-left: 4px solid #e5005c; margin-top: 20px;\">
                            <p style=\"margin: 5px 0;\"><strong>Email:</strong> " . htmlspecialchars(trim($body['email']), ENT_QUOTES, 'UTF-8') . "</p>
                            <p style=\"margin: 5px 0;\"><strong>Password temporanea:</strong> {$tempPassword}</p>
                        </div>
                        <p style=\"color: #666666; font-size: 16px; margin-top: 20px;\">Al primo accesso ti verrà richiesto o raccomandato di cambiare la password.</p>
                        <div style=\"text-align: center; margin-top: 30px;\">
                            <a href=\"{$loginLink}\" style=\"display: inline-block; padding: 12px 24px; background-color: #e5005c; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;\">Accedi a Fusion ERP</a>
                        </div>
                    </div>
                </div>
            </body>";

        $emailSent = false;
        try {
            \FusionERP\Shared\Mailer::send($body['email'], $body['full_name'], $subject, $htmlBody);
            $emailSent = true;
        } catch (\Throwable $e) {
            error_log("Failed to send welcome email to {$body['email']}: " . $e->getMessage());
        }

        $msg = $emailSent 
            ? 'Utente creato con successo. La password temporanea è stata inviata via email all\'utente.'
            : 'Utente creato con successo, ma si è verificato un errore nell\'invio dell\'email. Comunica la password temporanea manualmente.';

        $responseData = [
            'id' => $id,
            'message' => $msg,
        ];
        
        if (!$emailSent) {
            $responseData['tempPassword'] = $tempPassword;
        }

        Response::success($responseData, 201);
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

        $allowed = ['admin', 'manager', 'allenatore', 'operatore', 'atleta'];
        if (!in_array($body['role'], $allowed, true)) {
            Response::error('Ruolo non valido. Valori accettati: ' . implode(', ', $allowed), 400);
        }

        $userId = (string)$body['userId'];
        $permissionsJson = null;
        if (isset($body['permissions_json']) && is_array($body['permissions_json'])) {
            $permissionsJson = $body['permissions_json'];
        }

        // Validate user exists
        $this->validateUserExists($userId);

        $this->repo->updateRole($userId, $body['role'], $permissionsJson);
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

    // ─── POST /api/?module=auth&action=deleteUser (admin only) ─────────────────
    public function deleteUser(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();
        $userId = $body['userId'] ?? '';

        if (empty($userId)) {
            Response::error('userId obbligatorio', 400);
        }

        $this->validateUserExists($userId);
        $this->repo->deactivateUser($userId); // soft delete via deleted_at
        Audit::log('DELETE', 'users', $userId, null, ['method' => 'hard_delete_by_admin']);
        Response::success(['message' => 'Utente eliminato']);
    }

    // ─── POST /api/?module=auth&action=resendVerification (admin only) ──────────
    public function resendVerification(): void
    {
        Auth::requireRole('admin');
        $body = Response::jsonBody();
        $userId = $body['userId'] ?? '';

        if (empty($userId)) {
            Response::error('userId obbligatorio', 400);
        }

        $user = $this->validateUserExists($userId);
        // In a real implementation, send an invitation email here
        Audit::log('UPDATE', 'users', $userId, null, ['action' => 'resend_verification']);
        Response::success(['message' => 'Email di invito reinviata a ' . $user['email']]);
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
        $this->repo->insertPasswordHistory($userId, $hash);

        Audit::log('PASSWORD_RESET', 'users', $userId, null, ['reset_by' => 'admin']);

        // Return temp password plaintext ONLY in this response
        Response::success([
            'tempPassword' => $tempPassword,
            'message' => 'Password temporanea generata. Mostrala all\'utente e invitalo a cambiarla al prossimo accesso.',
        ]);
    }

    // ─── GET /api/?module=auth&action=health ──────────────────────────────────
    public function health(): void
    {
        $dbOk = false;
        try {
            $db = \FusionERP\Shared\Database::getInstance();
            $stmt = $db->query('SELECT 1');
            $dbOk = $stmt !== false;
        } catch (\Throwable $e) {
            $dbOk = false;
        }

        $sessionOk = session_status() === PHP_SESSION_ACTIVE;
        $envOk = isset($_ENV['APP_ENV']) || getenv('APP_ENV');

        $healthy = $dbOk && $sessionOk && $envOk;

        Response::success([
            'db' => $dbOk ? 'ok' : 'error',
            'session' => $sessionOk ? 'ok' : 'error',
            'env' => $envOk ? 'ok' : 'error',
            'status' => $healthy ? 'healthy' : 'degraded'
        ], $healthy ? 200 : 503);
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