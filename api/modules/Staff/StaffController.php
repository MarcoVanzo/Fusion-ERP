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
        // Auth::requireRole('manager');
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

    // ─── PHOTO UPLOAD ────────────────────────────────────────────────────────
    public function uploadPhoto(): void
    {
        $user = Auth::requireRole('operator');
        
        $id = filter_input(INPUT_POST, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($id)) {
            Response::error('ID staff mancante', 400);
        }

        $member = $this->repo->getById($id);
        if (!$member) {
            Response::error('Membro staff non trovato', 404);
        }

        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('File non caricato o errore upload', 400);
        }

        $file = $_FILES['file'];
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'], true)) {
            Response::error('Formato non supportato (solo JPG, PNG, WEBP)', 415);
        }

        $storagePath = dirname(__DIR__, 3) . '/storage/photos/';
        if (!is_dir($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safeFilename = 'staff_' . $id . '_' . time() . '.' . strtolower($ext);
        $fullPath = $storagePath . $safeFilename;

        if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
            Response::error('Errore salvataggio foto', 500);
        }

        $relPath = 'storage/photos/' . $safeFilename;

        // Delete old photo if exists
        if (!empty($member['photo_path'])) {
            $oldPath = dirname(__DIR__, 3) . '/' . $member['photo_path'];
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }

        $this->repo->updatePhoto($id, $relPath);
        
        Audit::log('UPDATE', 'staff_members', $id, null, ['photo_path' => $relPath]);
        Response::success(['photo_path' => $relPath]);
    }

    // ─── CONTRACT GENERATION & SIGNING ───────────────────────────────────────
    public function generateContract(): void
    {
        $user = Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['staff_id', 'valid_from', 'valid_to']);

        $id = $body['staff_id'];
        $member = $this->repo->getById($id);
        if (!$member) {
            Response::error('Membro staff non trovato', 404);
        }

        if (empty($member['email'])) {
            Response::error('Il membro dello staff deve avere un indirizzo email per la firma digitale', 400);
        }

        $validFrom = $body['valid_from'];
        $validTo = $body['valid_to'];
        $fee = $body['monthly_fee'] ?? null;
        
        // Setup mPDF
        require_once dirname(__DIR__, 3) . '/vendor/autoload.php';
        
        try {
            $mpdf = new \Mpdf\Mpdf([
                'mode' => 'utf-8', 'format' => 'A4',
                'margin_top' => 25, 'margin_bottom' => 25,
                'margin_left' => 25, 'margin_right' => 25,
            ]);

            $dateFromFormatted = date('d/m/Y', strtotime($validFrom));
            $dateToFormatted = date('d/m/Y', strtotime($validTo));
            $feeStr = $fee ? '€ ' . number_format((float)$fee, 2, ',', '.') . '/mese' : 'A titolo gratuito';

            $html = <<<HTML
            <style>
            body { font-family: 'DejaVu Sans', sans-serif; font-size: 11pt; color: #000; }
            h1 { font-size: 18pt; text-transform: uppercase; letter-spacing: 3px; text-align: center; margin-bottom: 5px; }
            .subtitle { text-align: center; font-size: 9pt; color: #555; margin-bottom: 30px; }
            .section { margin-bottom: 18px; }
            .section h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #000; padding-bottom: 4px; }
            .field { margin: 5px 0; }
            .signature-line { border-top: 1px solid #000; width: 250px; margin-top: 40px; }
            </style>
            <h1>Contratto di Collaborazione Sportiva</h1>
            <p class="subtitle">D.Lgs. 36/2021 — Riforma dello Sport</p>
            <div class="section">
            <h2>Soggetti</h2>
            <p class="field"><strong>Collaboratore:</strong> {$member['full_name']}</p>
            <p class="field"><strong>Email:</strong> {$member['email']}</p>
            <p class="field"><strong>Codice Fiscale:</strong> {$member['fiscal_code']}</p>
            </div>
            <div class="section">
            <h2>Oggetto del contratto</h2>
            <p class="field"><strong>Ruolo/Mansione:</strong> {$member['role']}</p>
            <p class="field"><strong>Tipo:</strong> Collaboratore Sportivo</p>
            </div>
            <div class="section">
            <h2>Durata e Compenso</h2>
            <p class="field"><strong>Periodo:</strong> dal {$dateFromFormatted} al {$dateToFormatted}</p>
            <p class="field"><strong>Compenso:</strong> {$feeStr}</p>
            </div>
            <div class="section">
            <h2>Firme</h2>
            <table width="100%"><tr>
                <td><div class="signature-line"></div><p>Il Collaboratore</p></td>
                <td><div class="signature-line"></div><p>Il Responsabile ASD</p></td>
            </tr></table>
            </div>
            <p style="margin-top:30px;font-size:8pt;color:#888;">Documento generato da Fusion ERP per {$member['full_name']}</p>
HTML;

            $mpdf->WriteHTML($html);
            $pdfContent = $mpdf->Output('', 'S');
            $pdfBase64 = base64_encode($pdfContent);
            
            require_once dirname(__DIR__, 2) . '/Shared/ESignatureService.php';
            
            $signers = [[
                'name' => $member['first_name'],
                'surname' => $member['last_name'],
                'email' => $member['email'],
                'mobile' => $member['phone'] ?? '',
                'authentication' => ['email'] // OTP via email
            ]];

            $signaturePos = ['page' => 1, 'x' => 50, 'y' => 100];
            
            $result = \FusionERP\Shared\ESignatureService::sendForSignature($pdfBase64, $signers, $signaturePos);
            
            $esignDocumentId = null;
            $esignSigningUrl = null;
            
            if ($result['success']) {
                $esignDocumentId = $result['document_id'];
                $esignSigningUrl = $result['signing_url'];
                $status = 'inviato';
            } else {
                // STUB MODE or API Error
                $esignDocumentId = 'stub_' . bin2hex(random_bytes(8));
                $status = 'generato';
                error_log('[STAFF] eSignature API error or STUB mode: ' . ($result['error'] ?? 'API not matching'));
            }

            $this->repo->updateContractInfo($id, [
                ':contract_status' => $status,
                ':contract_esign_document_id' => $esignDocumentId,
                ':contract_esign_signing_url' => $esignSigningUrl,
                ':contract_valid_from' => $validFrom,
                ':contract_valid_to' => $validTo,
                ':contract_monthly_fee' => $fee,
                ':contract_signed_pdf_path' => null
            ]);
            
            // Send email via PHPMailer
            $emailSent = false;
            try {
                $mail = new \PHPMailer\PHPMailer\PHPMailer(true);
                $mail->isMail();
                $mail->CharSet = 'UTF-8';
                $mail->setFrom('info@fusionteamvolley.it', 'Fusion Team Volley');
                $mail->addAddress($member['email'], $member['full_name']);
                $mail->isHTML(true);
                $mail->Subject = '✍️ Contratto di Collaborazione Sportiva';
                
                $cta = '';
                if ($esignSigningUrl) {
                    $cta = "<div style='text-align: center; margin: 30px 0;'><a href='{$esignSigningUrl}' style='display: inline-block; background: #FF00FF; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;'>FIRMA IL CONTRATTO</a></div>";
                }
                
                $mail->Body = "Ciao {$member['full_name']},<br><br>Ti abbiamo inviato il contratto di collaborazione.<br>{$cta}<br>Fusion ERP";
                $mail->addStringAttachment($pdfContent, 'contratto_collaborazione.pdf', 'base64', 'application/pdf');
                $mail->send();
                $emailSent = true;
            } catch (\Exception $e) {
                error_log('[STAFF] Email PHPMailer error: ' . $e->getMessage());
            }

            Audit::log('UPDATE', 'staff_members', $id, null, ['action' => 'Generato contratto', 'status' => $status]);
            
            Response::success([
                'status' => $status,
                'document_id' => $esignDocumentId,
                'email_sent' => $emailSent
            ]);

        } catch (\Throwable $e) {
             Response::error('Errore generazione contratto: ' . $e->getMessage(), 500);
        }
    }

    public function checkContractStatus(): void
    {
        Auth::requireRole('manager');
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($id)) {
            Response::error('id obbligatorio', 400);
        }

        $member = $this->repo->getById($id);
        if (!$member) {
            Response::error('Membro non trovato', 404);
        }

        $documentId = $member['contract_esign_document_id'];
        if (empty($documentId) || str_starts_with($documentId, 'stub_')) {
            Response::success([
                'status' => $member['contract_status'],
                'stub_mode' => true
            ]);
        }
        
        require_once dirname(__DIR__, 2) . '/Shared/ESignatureService.php';
        $statusResult = \FusionERP\Shared\ESignatureService::getStatus($documentId);

        if ($statusResult['success']) {
            $isSigned = $statusResult['signed'] ?? false;
            if ($isSigned && $member['contract_status'] !== 'firmato') {
                // Try download
                $docResult = \FusionERP\Shared\ESignatureService::getSignedDocument($documentId);
                $pdfPath = null;
                if ($docResult['success'] && !empty($docResult['pdf_content'])) {
                    $uploadDir = dirname(__DIR__, 3) . '/storage/pdfs/contratti_firmati/';
                    if (!is_dir($uploadDir)) mkdir($uploadDir, 0755, true);
                    $filename = 'contratto_firmato_staff_' . $documentId . '_' . date('Ymd_His') . '.pdf';
                    if (file_put_contents($uploadDir . $filename, $docResult['pdf_content'])) {
                        $pdfPath = 'storage/pdfs/contratti_firmati/' . $filename;
                    }
                }
                
                $updateData = [
                    ':contract_status' => 'firmato',
                    ':contract_esign_document_id' => $documentId,
                    ':contract_esign_signing_url' => $member['contract_esign_signing_url'],
                    ':contract_valid_from' => $member['contract_valid_from'],
                    ':contract_valid_to' => $member['contract_valid_to'],
                    ':contract_monthly_fee' => $member['contract_monthly_fee'],
                    ':contract_signed_pdf_path' => $pdfPath
                ];
                $this->repo->updateContractInfo($id, $updateData);
                $member['contract_status'] = 'firmato';
            }

            Response::success([
                'status' => $member['contract_status'],
                'remote_status' => $statusResult['status'],
                'signed' => $isSigned
            ]);
        } else {
             Response::error('Impossibile verificare stato: ' . ($statusResult['error'] ?? 'API error'), 502);
        }
    }

    public function downloadContract(): void
    {
        Auth::requireRole('manager');
        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
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

    // ─── PUBLIC ENDPOINTS FOR WEBSITE ──────────────────────────────────────────────
    public function getPublicStaff(): void
    {
        // Nessun controllo auth per la vista pubblica
        $teamId = filter_input(INPUT_GET, 'teamId', FILTER_SANITIZE_SPECIAL_CHARS);
        if ($teamId) {
            Response::success($this->repo->getPublicStaffByTeam($teamId));
        }
        else {
            Response::success($this->repo->listStaff());
        }
    }
}