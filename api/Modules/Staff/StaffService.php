<?php
/**
 * Staff Service — Domain Logic and Integrations
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Staff;

use FusionERP\Shared\Audit;
use Exception;

class StaffService
{
    private StaffRepository $repo;

    public function __construct()
    {
        $this->repo = new StaffRepository();
    }

    /**
     * Handles file uploads for staff documents and photos.
     * 
     * @param string $id       The Staff ID
     * @param array $fileData  The $_FILES['file'] array
     * @param string $dbField  The repository field to update (e.g., photo_path, contract_file_path)
     * @param array $allowedMimes Array of allowed MIME types
     * @param string $subDir   Subdirectory inside storage (e.g., 'photos', 'docs/staff')
     * @return array{path: string, filename: string}
     * @throws Exception
     */
    public function handleFileUpload(string $id, array $fileData, string $dbField, array $allowedMimes, string $subDir): array
    {
        $member = $this->repo->getById($id);
        if (!$member) {
            throw new Exception("Membro staff non trovato", 404);
        }

        if (empty($fileData) || $fileData['error'] !== UPLOAD_ERR_OK) {
            throw new Exception("File non caricato o errore upload", 400);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($fileData['tmp_name']);

        if (!in_array($mimeType, $allowedMimes, true)) {
            throw new Exception("Formato non supportato", 415);
        }

        $storagePath = dirname(__DIR__, 3) . '/storage/' . $subDir . '/';
        if (!is_dir($storagePath)) {
            mkdir($storagePath, 0755, true);
        }

        $ext = strtolower(pathinfo($fileData['name'], PATHINFO_EXTENSION));
        // Distinguish filename based on whether it's a photo or a document
        $prefix = ($dbField === 'photo_path') ? 'staff_' : 'staff_' . $dbField . '_';
        $safeFilename = $prefix . $id . '_' . time() . '.' . $ext;
        $fullPath = $storagePath . $safeFilename;

        if (!move_uploaded_file($fileData['tmp_name'], $fullPath)) {
            throw new Exception("Errore salvataggio file su disco", 500);
        }

        $relPath = 'storage/' . $subDir . '/' . $safeFilename;

        // Delete old file if it exists
        $oldPath = $member[$dbField] ?? null;
        if (!empty($oldPath)) {
            $oldFullPath = dirname(__DIR__, 3) . '/' . $oldPath;
            if (file_exists($oldFullPath)) {
                unlink($oldFullPath);
            }
        }

        if ($dbField === 'photo_path') {
            $this->repo->updatePhoto($id, $relPath);
        } else {
            $this->repo->updateDocumentPath($id, $dbField, $relPath);
        }

        Audit::log('UPDATE', 'staff_members', $id, null, [$dbField => $relPath]);

        return [
            'path' => $relPath,
            'filename' => basename($relPath)
        ];
    }

    /**
     * Generates a collaboration contract PDF and sends it for signature.
     * 
     * @param string $id
     * @param string $validFrom YYYY-MM-DD
     * @param string $validTo YYYY-MM-DD
     * @param float|null $fee
     * @return array
     * @throws Exception
     */
    public function generateAndSendContract(string $id, string $validFrom, string $validTo, ?float $fee): array
    {
        $member = $this->repo->getById($id);
        if (!$member) {
            throw new Exception("Membro staff non trovato", 404);
        }

        if (empty($member['email'])) {
            throw new Exception("Il membro dello staff deve avere un indirizzo email per la firma digitale", 400);
        }

        // Setup mPDF
        require_once dirname(__DIR__, 3) . '/vendor/autoload.php';

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
            'authentication' => ['email']
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
            error_log('[STAFF] eSignature API error or STUB mode: ' . ($result['error'] ?? 'API non corrispondente'));
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

        return [
            'status' => $status,
            'document_id' => $esignDocumentId,
            'email_sent' => $emailSent
        ];
    }

    /**
     * Checks contract signature status with external provider.
     * 
     * @param string $id
     * @return array
     * @throws Exception
     */
    public function checkContractStatus(string $id): array
    {
        $member = $this->repo->getById($id);
        if (!$member) {
            throw new Exception('Membro non trovato', 404);
        }

        $documentId = $member['contract_esign_document_id'];
        if (empty($documentId) || str_starts_with($documentId, 'stub_')) {
            return [
                'status' => $member['contract_status'],
                'stub_mode' => true
            ];
        }

        require_once dirname(__DIR__, 2) . '/Shared/ESignatureService.php';
        $statusResult = \FusionERP\Shared\ESignatureService::getStatus($documentId);

        if (!$statusResult['success']) {
            throw new Exception('Impossibile verificare stato: ' . ($statusResult['error'] ?? 'API error'), 502);
        }

        $isSigned = $statusResult['signed'] ?? false;
        if ($isSigned && $member['contract_status'] !== 'firmato') {
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

        return [
            'status' => $member['contract_status'],
            'remote_status' => $statusResult['status'],
            'signed' => $isSigned
        ];
    }
}
