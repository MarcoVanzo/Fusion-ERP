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
require_once __DIR__ . '/StaffService.php';

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class StaffController
{
    private StaffRepository $repo;
    private StaffService $service;

    public function __construct()
    {
        $this->repo = new StaffRepository();
        $this->service = new StaffService();
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
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
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
        Auth::requireRole('social media manager');
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
        // Auth::requireRole('social media manager');
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
        Auth::requireRole('social media manager');
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

    // ─── PHOTO UPLOAD ────────────────────────────────────────────────────────
    public function uploadPhoto(): void
    {
        Auth::requireRole('operator');
        $id = filter_input(INPUT_POST, 'id', FILTER_DEFAULT) ?? '';

        try {
            $result = $this->service->handleFileUpload(
                $id,
                $_FILES['file'] ?? [],
                'photo_path',
                ['image/jpeg', 'image/png', 'image/webp'],
                'photos'
            );
            Response::success(['photo_path' => $result['path']]);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $httpCode);
        }
    }

    // ─── CONTRACT GENERATION & SIGNING ───────────────────────────────────────
    public function generateContract(): void
    {
        Auth::requireRole('social media manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['staff_id', 'valid_from', 'valid_to']);

        try {
            $result = $this->service->generateAndSendContract(
                $body['staff_id'],
                $body['valid_from'],
                $body['valid_to'],
                $body['monthly_fee'] ?? null
            );
            Response::success($result);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error('Errore generazione contratto: ' . $e->getMessage(), $httpCode);
        }
    }

    public function checkContractStatus(): void
    {
        Auth::requireRole('social media manager');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        try {
            $result = $this->service->checkContractStatus($id);
            Response::success($result);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $httpCode);
        }
    }

    public function downloadContract(): void
    {
        Auth::requireRole('social media manager');
        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        $member = $this->repo->getById($id);
        if (!$member || empty($member['contract_signed_pdf_path'])) {
            Response::error('Documento PDF non trovato per questo staff', 404);
        }

        $fullPath = dirname(__DIR__, 3) . '/' . $member['contract_signed_pdf_path'];
        if (!file_exists($fullPath)) {
            Response::error('File fisico PDF non trovato sul server', 404);
        }

        header('Content-Type: application/pdf');
        header('Content-Disposition: inline; filename="' . basename($fullPath) . '"');
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        exit;
    }

    // ─── DOCUMENT FILE UPLOADS ────────────────────────────────────────────────
    /**
     * Shared helper for all 3 staff document uploads.
     * $dbField must be one of: contract_file_path, id_doc_file_path, cf_doc_file_path
     */
    private function uploadStaffDocument(string $dbField): void
    {
        Auth::requireRole('operator');
        $id = filter_input(INPUT_POST, 'id', FILTER_DEFAULT) ?? '';

        try {
            $result = $this->service->handleFileUpload(
                $id,
                $_FILES['file'] ?? [],
                $dbField,
                ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
                'docs/staff'
            );
            Response::success($result);
        } catch (\Exception $e) {
            $code = $e->getCode();
            $httpCode = (is_int($code) && $code >= 400 && $code <= 599) ? $code : 500;
            Response::error($e->getMessage(), $httpCode);
        }
    }

    public function uploadContractFile(): void
    {
        $this->uploadStaffDocument('contract_file_path');
    }

    public function uploadIdDoc(): void
    {
        $this->uploadStaffDocument('id_doc_file_path');
    }

    public function uploadIdDocBack(): void
    {
        $this->uploadStaffDocument('id_doc_back_file_path');
    }

    public function uploadCfDoc(): void
    {
        $this->uploadStaffDocument('cf_doc_file_path');
    }

    public function uploadCfDocBack(): void
    {
        $this->uploadStaffDocument('cf_doc_back_file_path');
    }

    public function downloadDoc(): void
    {
        Auth::requireRole('operator');
        $id    = filter_input(INPUT_GET, 'id',    FILTER_DEFAULT) ?? '';
        $field = filter_input(INPUT_GET, 'field',  FILTER_DEFAULT) ?? '';

        $allowed = ['contract_file_path', 'id_doc_file_path', 'id_doc_back_file_path', 'cf_doc_file_path', 'cf_doc_back_file_path'];
        if (empty($id) || !in_array($field, $allowed, true)) {
            Response::error('Parametri non validi', 400);
        }

        $member = $this->repo->getById($id);
        if (!$member || empty($member[$field])) {
            Response::error('Documento non trovato', 404);
        }

        $fullPath = dirname(__DIR__, 3) . '/' . $member[$field];
        if (!file_exists($fullPath)) {
            Response::error('File fisico non trovato sul server', 404);
        }

        $finfo    = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($fullPath);
        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: inline; filename="' . basename($fullPath) . '"');
        header('Content-Length: ' . filesize($fullPath));
        readfile($fullPath);
        exit;
    }

    // ─── PUBLIC ENDPOINTS FOR WEBSITE ──────────────────────────────────────────────
    public function getPublicStaff(): void
    {
        // Nessun controllo auth per la vista pubblica
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_DEFAULT);
        if ($teamId) {
            Response::success($this->repo->getPublicStaffByTeam($teamId));
        }
        else {
            Response::success($this->repo->listStaff());
        }
    }
}