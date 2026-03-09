<?php
/**
 * Staff Controller — CRUD for staff_members
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Staff;

// Explicit require_once needed because server uses optimized classmap autoloader
$_staffShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_staffShared . 'Auth.php';
require_once $_staffShared . 'Audit.php';
require_once $_staffShared . 'Response.php';
require_once $_staffShared . 'TenantContext.php';
unset($_staffShared);
require_once __DIR__ . '/StaffRepository.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class StaffController
{
    private StaffRepository $repo;

    public function __construct()
    {
        $this->repo = new StaffRepository();
    }

    // ─── GET /api/?module=staff&action=list ───────────────────────────────────
    public function list(): void
    {
        Auth::requireRole('operator');
        Response::success($this->repo->listStaff());
    }

    // ─── GET /api/?module=staff&action=get&id=STF_xxx ─────────────────────────
    public function get(): void
    {
        Auth::requireRole('operator');
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $member = $this->repo->getById($id);
        if (!$member) {
            Response::error('Membro staff non trovato', 404);
        }
        Response::success($member);
    }

    // ─── POST /api/?module=staff&action=create ────────────────────────────────
    public function create(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['first_name', 'last_name']);

        $id = 'STF_' . bin2hex(random_bytes(4));
        $tenantId = TenantContext::id();

        $data = [
            ':id' => $id,
            ':tenant_id' => $tenantId,
            ':first_name' => htmlspecialchars(trim($body['first_name']), ENT_QUOTES, 'UTF-8'),
            ':last_name' => htmlspecialchars(trim($body['last_name']), ENT_QUOTES, 'UTF-8'),
            ':role' => $body['role'] ?? null,
            ':birth_date' => $body['birth_date'] ?? null,
            ':birth_place' => $body['birth_place'] ?? null,
            ':residence_address' => $body['residence_address'] ?? null,
            ':residence_city' => $body['residence_city'] ?? null,
            ':phone' => $body['phone'] ?? null,
            ':email' => $body['email'] ?? null,
            ':fiscal_code' => isset($body['fiscal_code']) ? strtoupper(trim($body['fiscal_code'])) : null,
            ':identity_document' => $body['identity_document'] ?? null,
            ':medical_cert_expires_at' => $body['medical_cert_expires_at'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ];

        $teamIds = isset($body['team_ids']) && is_array($body['team_ids']) ? $body['team_ids'] : [];

        $this->repo->create($data, $teamIds);
        Audit::log('INSERT', 'staff_members', $id, null, ['first_name' => $body['first_name'], 'last_name' => $body['last_name'], 'team_ids' => $teamIds]);
        Response::success(['id' => $id], 201);
    }

    // ─── POST /api/?module=staff&action=update ────────────────────────────────
    public function update(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['id', 'first_name', 'last_name']);

        $before = $this->repo->getById($body['id']);
        if (!$before) {
            Response::error('Membro staff non trovato', 404);
        }

        $data = [
            ':first_name' => htmlspecialchars(trim($body['first_name']), ENT_QUOTES, 'UTF-8'),
            ':last_name' => htmlspecialchars(trim($body['last_name']), ENT_QUOTES, 'UTF-8'),
            ':role' => $body['role'] ?? null,
            ':birth_date' => $body['birth_date'] ?? null,
            ':birth_place' => $body['birth_place'] ?? null,
            ':residence_address' => $body['residence_address'] ?? null,
            ':residence_city' => $body['residence_city'] ?? null,
            ':phone' => $body['phone'] ?? null,
            ':email' => $body['email'] ?? null,
            ':fiscal_code' => isset($body['fiscal_code']) ? strtoupper(trim($body['fiscal_code'])) : null,
            ':identity_document' => $body['identity_document'] ?? null,
            ':medical_cert_expires_at' => $body['medical_cert_expires_at'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ];

        $teamIds = isset($body['team_ids']) && is_array($body['team_ids']) ? $body['team_ids'] : [];

        $this->repo->update($body['id'], $data, $teamIds);
        Audit::log('UPDATE', 'staff_members', $body['id'], $before, $body);
        Response::success(['message' => 'Membro staff aggiornato']);
    }

    // ─── POST /api/?module=staff&action=delete ────────────────────────────────
    public function delete(): void
    {
        Auth::requireRole('manager');
        $body = Response::jsonBody();
        $id = $body['id'] ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }
        $before = $this->repo->getById($id);
        if (!$before) {
            Response::error('Membro staff non trovato', 404);
        }
        $this->repo->softDelete($id);
        Audit::log('DELETE', 'staff_members', $id, $before, null);
        Response::success(['message' => 'Membro staff rimosso']);
    }

    // ─── PUBLIC ENDPOINTS FOR WEBSITE ──────────────────────────────────────────────
    public function getPublicStaff(): void
    {
        // Nessun controllo auth per la vista pubblica
        Response::success($this->repo->listStaff());
    }
}