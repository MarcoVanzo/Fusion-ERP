<?php
/**
 * Tenant Controller — Multi-Tenant Management
 * Fusion ERP v1.0
 *
 * Handles: tenant creation (signup), settings, member management,
 * and tenant switching for users belonging to multiple organisations.
 */

declare(strict_types=1);

namespace FusionERP\Modules\Tenant;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class TenantController
{
    private TenantRepository $repo;

    public function __construct()
    {
        $this->repo = new TenantRepository();
    }

    // ─── POST /api/?module=tenant&action=create ────────────────────────────────
    // Creates a new tenant (society registration / signup).
    public function create(): void
    {
        Auth::requireAuth(); // Defense-in-depth: tenant creation must be authenticated
        $body = Response::jsonBody();
        Response::requireFields($body, ['name', 'sport_type', 'legal_form']);

        $tenantId = 'TNT_' . bin2hex(random_bytes(4));
        $domain = $this->generateDomain($body['name']);

        $this->repo->createTenant([
            ':id' => $tenantId,
            ':name' => htmlspecialchars(trim($body['name']), ENT_QUOTES, 'UTF-8'),
            ':domain' => $domain,
        ]);

        // Set initial settings
        $defaults = [
            'sport_type' => $body['sport_type'],
            'legal_form' => $body['legal_form'] ?? 'ASD',
            'federation' => $body['federation'] ?? '',
            'season_format' => $body['season_format'] ?? date('Y') . '-' . (date('Y') + 1),
            'primary_color' => $body['primary_color'] ?? '#E6007E',
            'plan_tier' => 'starter',
            'club_name' => trim($body['name']),
            'max_teams' => '5', // Starter plan limit
            'max_athletes' => '100', // Starter plan limit
        ];
        foreach ($defaults as $key => $value) {
            $this->repo->setSetting($tenantId, $key, $value);
        }

        // Assign current user as superadmin of the new tenant
        $user = Auth::user();
        if ($user) {
            $this->repo->addMember($tenantId, $user['id'], ['superadmin']);
        }

        Audit::log('INSERT', 'tenants', $tenantId, null, ['name' => $body['name']]);
        Response::success([
            'id' => $tenantId,
            'domain' => $domain,
        ], 201);
    }

    // ─── GET /api/?module=tenant&action=current ────────────────────────────────
    // Returns the current tenant info + all settings.
    public function current(): void
    {
        Auth::requireAuth();
        $tenant = TenantContext::get();
        if (!$tenant) {
            Response::error('Tenant non trovato', 404);
        }

        $settings = TenantContext::allSettings();
        $tenant['settings'] = $settings;

        Response::success($tenant);
    }

    // ─── POST /api/?module=tenant&action=updateSettings ────────────────────────
    // Updates tenant settings (admin only).
    public function updateSettings(): void
    {
        Auth::requireWrite('admin');
        $body = Response::jsonBody();

        $allowedKeys = [
            'sport_type', 'federation', 'season_format', 'primary_color',
            'club_name', 'legal_form', 'billing_email', 'fiscal_code',
            'vat_number', 'address', 'city', 'province', 'zip_code',
            'phone', 'website', 'logo_path',
        ];

        $tenantId = TenantContext::id();
        $updated = [];

        foreach ($body as $key => $value) {
            if (in_array($key, $allowedKeys, true)) {
                $safeValue = is_string($value)
                    ? htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8')
                    : $value;
                $this->repo->setSetting($tenantId, $key, (string)$safeValue);
                $updated[$key] = $safeValue;
            }
        }

        if (empty($updated)) {
            Response::error('Nessuna impostazione valida fornita', 400);
        }

        Audit::log('UPDATE', 'tenant_settings', $tenantId, null, $updated);
        Response::success(['message' => 'Impostazioni aggiornate', 'updated' => $updated]);
    }

    // ─── GET /api/?module=tenant&action=members ────────────────────────────────
    // Lists all members of the current tenant.
    public function members(): void
    {
        Auth::requireRead('admin');
        $tenantId = TenantContext::id();
        $members = $this->repo->getMembers($tenantId);
        Response::success($members);
    }

    // ─── POST /api/?module=tenant&action=invite ────────────────────────────────
    // Invites a user to the current tenant by email.
    public function invite(): void
    {
        Auth::requireWrite('admin');
        $body = Response::jsonBody();
        Response::requireFields($body, ['email', 'roles']);

        $tenantId = TenantContext::id();
        $email = filter_var(trim($body['email']), FILTER_VALIDATE_EMAIL);
        if (!$email) {
            Response::error('Indirizzo email non valido', 400);
        }

        $roles = is_array($body['roles']) ? $body['roles'] : [$body['roles']];

        // Check if user already exists
        $existingUser = $this->repo->findUserByEmail($email);

        if ($existingUser) {
            // User exists — add to tenant
            $this->repo->addMember($tenantId, $existingUser['id'], $roles);
            Audit::log('INVITE', 'tenant_users', $tenantId, null, [
                'user_id' => $existingUser['id'],
                'email' => $email,
                'roles' => $roles,
            ]);
            Response::success(['message' => 'Utente aggiunto al tenant', 'user_id' => $existingUser['id']]);
        }
        else {
            // User doesn't exist — create pending invitation
            $inviteId = 'INV_' . bin2hex(random_bytes(4));
            $this->repo->createInvite([
                ':id' => $inviteId,
                ':tenant_id' => $tenantId,
                ':email' => $email,
                ':roles' => json_encode($roles),
                ':invited_by' => Auth::user()['id'] ?? null,
            ]);

            // Send invitation email
            $appUrl = $_ENV['APP_URL'] ?? 'https://www.fusionteamvolley.it/ERP';
            $tenant = TenantContext::get();
            $tenantName = $tenant['name'] ?? 'Fusion ERP';
            $inviterName = Auth::user()['full_name'] ?? 'Un amministratore';

            $htmlBody = "
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #E6007E;'>Sei stato invitato su {$tenantName}</h2>
                    <p>Ciao,</p>
                    <p><strong>{$inviterName}</strong> ti ha invitato a unirti alla piattaforma <strong>{$tenantName}</strong> su Fusion ERP.</p>
                    <p>Ruoli assegnati: <strong>" . implode(', ', $roles) . "</strong></p>
                    <p style='margin: 30px 0;'>
                        <a href='{$appUrl}' style='background: #E6007E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;'>Accedi a Fusion ERP</a>
                    </p>
                    <p style='font-size: 12px; color: #999;'>Se non riconosci questo invito, puoi ignorare questa email.</p>
                </div>
            ";

            \FusionERP\Shared\Mailer::send(
                $email,
                '',
                "Invito a {$tenantName} — Fusion ERP",
                $htmlBody
            );

            Audit::log('INVITE', 'tenant_invitations', $inviteId, null, [
                'email' => $email,
                'roles' => $roles,
            ]);
            Response::success(['message' => 'Invito inviato', 'invite_id' => $inviteId], 201);
        }
    }

    // ─── POST /api/?module=tenant&action=removeMember ──────────────────────────
    public function removeMember(): void
    {
        Auth::requireWrite('admin');
        $body = Response::jsonBody();
        Response::requireFields($body, ['user_id']);

        $tenantId = TenantContext::id();
        $userId = $body['user_id'];

        // Prevent removing yourself
        $currentUser = Auth::user();
        if ($currentUser && $currentUser['id'] === $userId) {
            Response::error('Non puoi rimuovere te stesso dal tenant', 400);
        }

        $this->repo->removeMember($tenantId, $userId);
        Audit::log('DELETE', 'tenant_users', $tenantId, ['user_id' => $userId], null);
        Response::success(['message' => 'Membro rimosso']);
    }

    // ─── GET /api/?module=tenant&action=myTenants ──────────────────────────────
    // Returns all tenants the current user belongs to (for tenant switching).
    public function myTenants(): void
    {
        $user = Auth::requireAuth();
        $tenants = $this->repo->getUserTenants($user['id']);
        Response::success($tenants);
    }

    // ─── POST /api/?module=tenant&action=switchTenant ──────────────────────────
    // Switches the active tenant in the session.
    public function switchTenant(): void
    {
        $user = Auth::requireAuth();
        $body = Response::jsonBody();
        Response::requireFields($body, ['tenant_id']);

        $targetTenant = $body['tenant_id'];

        // Verify user belongs to target tenant
        $membership = $this->repo->getMembership($targetTenant, $user['id']);
        if (!$membership) {
            Response::error('Non sei membro di questo tenant', 403);
        }

        // Update session
        $_SESSION['user']['tenant_id'] = $targetTenant;
        TenantContext::setOverride($targetTenant);

        $tenant = TenantContext::get();
        Response::success([
            'message' => 'Tenant cambiato',
            'tenant_id' => $targetTenant,
            'tenant' => $tenant,
        ]);
    }

    // ─── GET /api/?module=tenant&action=planLimits ─────────────────────────────
    // Returns current usage vs plan limits.
    public function planLimits(): void
    {
        Auth::requireRead('admin');
        $tenantId = TenantContext::id();

        $maxTeams = (int)TenantContext::setting('max_teams', '5');
        $maxAthletes = (int)TenantContext::setting('max_athletes', '100');
        $planTier = TenantContext::setting('plan_tier', 'starter');

        $usage = $this->repo->getUsage($tenantId);

        Response::success([
            'plan' => $planTier,
            'limits' => [
                'teams' => ['used' => $usage['teams'], 'max' => $maxTeams],
                'athletes' => ['used' => $usage['athletes'], 'max' => $maxAthletes],
            ],
        ]);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private function generateDomain(string $name): string
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9]+/', '-', $slug);
        $slug = trim($slug, '-');
        $baseDomain = getenv('BASE_DOMAIN') ?: 'fusionerp.it';
        return $slug . '.' . $baseDomain;
    }
}