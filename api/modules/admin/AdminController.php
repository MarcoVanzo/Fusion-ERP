<?php
/**
 * Admin Controller — Medical Certs (OCR), Contracts (mPDF), Documents
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Admin;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use Mpdf\Mpdf;

class AdminController
{
    private AdminRepository $repo;

    public function __construct()
    {
        $this->repo = new AdminRepository();
    }

    // ─── MEDICAL CERTIFICATES ─────────────────────────────────────────────────

    public function listCertificates(): void
    {
        Auth::requireRole('operator');
        $athleteId = filter_input(INPUT_GET, 'athleteId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $expiringSoon = filter_input(INPUT_GET, 'expiringSoon', FILTER_VALIDATE_BOOLEAN) ?: false;
        Response::success($this->repo->listCertificates($athleteId, $expiringSoon));
    }

    /**
     * Upload medical certificate + OCR via Gemini API to extract expiry date.
     * Accepts multipart/form-data.
     */
    public function uploadCertificate(): void
    {
        $user = Auth::requireRole('operator');

        // Validate upload
        if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            Response::error('File non caricato o errore upload', 400);
        }

        $file = $_FILES['file'];
        $athleteId = htmlspecialchars($_POST['athlete_id'] ?? '', ENT_QUOTES, 'UTF-8');
        $type = in_array($_POST['type'] ?? '', ['agonistico', 'non_agonistico']) ? $_POST['type'] : 'agonistico';

        if (empty($athleteId)) {
            Response::error('athlete_id obbligatorio', 400);
        }

        // Server-side MIME validation
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        $allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!in_array($mimeType, $allowed, true)) {
            Response::error('Tipo file non supportato. Usare JPG, PNG, WEBP o PDF.', 415);
        }

        // Rename file with hash, never expose original name on disk
        $storagePath = rtrim(getenv('UPLOAD_STORAGE_PATH') ?: '/tmp/', '/') . '/';
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safeFilename = bin2hex(random_bytes(16)) . '.' . strtolower($ext);
        $fullPath = $storagePath . $safeFilename;

        if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
            Response::error('Errore nel salvataggio del file', 500);
        }

        // OCR via Gemini API — extract expiry date only
        $ocrDate = null;
        $expiryDate = null;

        if (in_array($mimeType, ['image/jpeg', 'image/png', 'image/webp'])) {
            $ocrResult = $this->ocrCertificateViaGemini($fullPath, $mimeType);
            $ocrDate = $ocrResult['extracted_date'];
            $expiryDate = $ocrDate;
        }

        // Fallback: use manually provided date if OCR failed or file is PDF
        if (empty($expiryDate) && !empty($_POST['expiry_date'])) {
            $expiryDate = $_POST['expiry_date'];
        }

        if (empty($expiryDate)) {
            Response::error('Data di scadenza non trovata. Inserirla manualmente.', 422);
        }

        // Sanitize & validate date format
        $dateSanitized = htmlspecialchars($expiryDate, ENT_QUOTES, 'UTF-8');
        if (!\DateTime::createFromFormat('Y-m-d', $dateSanitized) &&
        !\DateTime::createFromFormat('d/m/Y', $dateSanitized)) {
            Response::error('Formato data non valido. Usare YYYY-MM-DD.', 400);
        }
        // Normalize to Y-m-d
        $dt = \DateTime::createFromFormat('d/m/Y', $dateSanitized)
            ?: \DateTime::createFromFormat('Y-m-d', $dateSanitized);
        $expiryDateNorm = $dt->format('Y-m-d');

        $certId = 'MED_' . bin2hex(random_bytes(4));
        $this->repo->createCertificate([
            ':id' => $certId,
            ':athlete_id' => $athleteId,
            ':type' => $type,
            ':expiry_date' => $expiryDateNorm,
            ':ocr_date' => $ocrDate,
            ':file_path' => $safeFilename,
            ':orig_name' => htmlspecialchars($file['name'], ENT_QUOTES, 'UTF-8'),
            ':uploaded_by' => $user['id'],
        ]);

        Audit::log('INSERT', 'medical_certificates', $certId, null, [
            'athlete_id' => $athleteId,
            'expiry_date' => $expiryDateNorm,
            'ocr_date' => $ocrDate,
        ]);

        Response::success([
            'id' => $certId,
            'expiry_date' => $expiryDateNorm,
            'ocr_date' => $ocrDate,
            'ocr_confidence' => !empty($ocrDate) ? 'high' : 'none',
        ], 201);
    }

    private function ocrCertificateViaGemini(string $imagePath, string $mimeType): array
    {
        $apiKey = getenv('GEMINI_API_KEY');
        if (empty($apiKey)) {
            return ['extracted_date' => null];
        }

        $imageData = base64_encode(file_get_contents($imagePath));
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={$apiKey}";

        $payload = json_encode([
            'contents' => [[
                    'parts' => [
                        [
                            'text' => 'Analizza questo certificato medico sportivo. Estrai SOLO la data di scadenza (o validità fino a). Rispondi SOLO con la data nel formato DD/MM/YYYY o YYYY-MM-DD. Se non trovi la data, rispondi con: NON_TROVATA.'
                        ],
                        [
                            'inline_data' => [
                                'mime_type' => $mimeType,
                                'data' => $imageData,
                            ]
                        ]
                    ]
                ]],
            'generationConfig' => ['maxOutputTokens' => 20, 'temperature' => 0.0],
        ]);

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_TIMEOUT => 25,
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        $rawDate = trim($data['candidates'][0]['content']['parts'][0]['text'] ?? '');

        if (empty($rawDate) || $rawDate === 'NON_TROVATA') {
            return ['extracted_date' => null];
        }

        return ['extracted_date' => $rawDate];
    }

    // ─── CONTRACTS ────────────────────────────────────────────────────────────

    public function listContracts(): void
    {
        Auth::requireRole('manager');
        $userId = filter_input(INPUT_GET, 'userId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        Response::success($this->repo->listContracts($userId));
    }

    /**
     * Generate a contract PDF via mPDF and save record to DB.
     */
    public function generateContract(): void
    {
        $adminUser = Auth::requireRole('manager');
        $body = Response::jsonBody();
        Response::requireFields($body, ['user_id', 'valid_from', 'valid_to', 'role_description']);

        $targetUser = $this->repo->getUserById((string)$body['user_id']);
        if (!$targetUser) {
            Response::error('Utente non trovato', 404);
        }

        $contractId = 'CTR_' . bin2hex(random_bytes(4));
        $this->repo->createContract([
            ':id' => $contractId,
            ':user_id' => (string)$body['user_id'],
            ':type' => $body['type'] ?? 'collaboratore_sportivo',
            ':role_description' => htmlspecialchars($body['role_description'], ENT_QUOTES, 'UTF-8'),
            ':valid_from' => $body['valid_from'],
            ':valid_to' => $body['valid_to'],
            ':monthly_fee_eur' => $body['monthly_fee_eur'] ?? null,
            ':created_by' => $adminUser['id'],
        ]);

        $pdfPath = $this->generateContractPdf($contractId, $targetUser, $body);
        if ($pdfPath) {
            $this->repo->updateContractPdf($contractId, $pdfPath);
        }

        Audit::log('INSERT', 'contracts', $contractId, null, $body);
        Response::success(['id' => $contractId, 'pdf_path' => $pdfPath], 201);
    }

    private function generateContractPdf(string $contractId, array $user, array $body): ?string
    {
        try {
            $mpdf = new Mpdf([
                'mode' => 'utf-8', 'format' => 'A4',
                'margin_top' => 25, 'margin_bottom' => 25,
                'margin_left' => 25, 'margin_right' => 25,
            ]);

            $dateFrom = date('d/m/Y', strtotime($body['valid_from']));
            $dateTo = date('d/m/Y', strtotime($body['valid_to']));
            $fee = $body['monthly_fee_eur'] ? '€ ' . (string)number_format((float)$body['monthly_fee_eur'], 2, ',', '.') . '/mese' : 'A titolo gratuito';

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
  <p class="field"><strong>Collaboratore:</strong> {$user['full_name']}</p>
  <p class="field"><strong>Email:</strong> {$user['email']}</p>
</div>
<div class="section">
  <h2>Oggetto del contratto</h2>
  <p class="field"><strong>Ruolo/Mansione:</strong> {$body['role_description']}</p>
  <p class="field"><strong>Tipo:</strong> Collaboratore Sportivo</p>
</div>
<div class="section">
  <h2>Durata e Compenso</h2>
  <p class="field"><strong>Periodo:</strong> dal {$dateFrom} al {$dateTo}</p>
  <p class="field"><strong>Compenso:</strong> {$fee}</p>
</div>
<div class="section">
  <h2>Firme</h2>
  <table width="100%"><tr>
    <td><div class="signature-line"></div><p>Il Collaboratore</p></td>
    <td><div class="signature-line"></div><p>Il Responsabile ASD</p></td>
  </tr></table>
</div>
<p style="margin-top:30px;font-size:8pt;color:#888;">Documento generato da Fusion ERP — ID: {$contractId}</p>
HTML;

            $mpdf->WriteHTML($html);
            $storagePath = getenv('PDF_STORAGE_PATH') ?: '/tmp/';
            $filename = "contratto_{$contractId}_" . date('Ymd') . '.pdf';
            $fullPath = rtrim($storagePath, '/') . '/' . $filename;
            $mpdf->Output($fullPath, 'F');
            return $filename;
        }
        catch (\Throwable $e) {
            error_log('[PDF] Contract generation failed: ' . $e->getMessage());
            return null;
        }
    }

    // ─── EXPIRING CERTS ALERT ─────────────────────────────────────────────────

    public function expiringCertificates(): void
    {
        Auth::requireRole('operator');
        $certs = $this->repo->listCertificates('', true);
        Response::success($certs);
    }
}