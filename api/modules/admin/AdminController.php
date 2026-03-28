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
use FusionERP\Shared\GoogleDrive;
use FusionERP\Shared\BackupService;
use FusionERP\Shared\AIService;
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
        $athleteId = filter_input(INPUT_GET, 'athleteId', FILTER_DEFAULT) ?? '';
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
        $imageData = base64_encode(file_get_contents($imagePath));
        
        $promptParts = [
            [
                'text' => 'Analizza questo certificato medico sportivo. Estrai SOLO la data di scadenza (o validità fino a). Rispondi SOLO con la data nel formato DD/MM/YYYY o YYYY-MM-DD. Se non trovi la data, rispondi con: NON_TROVATA.'
            ],
            [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data' => $imageData,
                ]
            ]
        ];

        try {
            $rawDate = trim(AIService::generateContent($promptParts, ['maxOutputTokens' => 20, 'temperature' => 0.0]));
        } catch (\Exception $e) {
            error_log('[ADMIN_OCR] Failed to extract expiry date: ' . $e->getMessage());
            return ['extracted_date' => null];
        }

        if (empty($rawDate) || $rawDate === 'NON_TROVATA') {
            return ['extracted_date' => null];
        }

        return ['extracted_date' => $rawDate];
    }

    // ─── CONTRACTS ────────────────────────────────────────────────────────────

    public function listContracts(): void
    {
        Auth::requireRole('social media manager');
        $userId = filter_input(INPUT_GET, 'userId', FILTER_DEFAULT) ?? '';
        Response::success($this->repo->listContracts($userId));
    }

    /**
     * Generate a contract PDF via mPDF and save record to DB.
     */
    public function generateContract(): void
    {
        $adminUser = Auth::requireRole('social media manager');
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

    // ─── SQL IMPORT (admin only) ──────────────────────────────────────────────

    /**
     * Execute a pre-generated SQL import file from uploads/.
     * Only whitelisted filenames are accepted to prevent arbitrary SQL execution.
     *
     * Usage: POST /api?module=admin&action=runSqlImport
     * Body:  { "file": "import_athletes.sql" }
     */
    public function runSqlImport(): void
    {
        Auth::requireRole('admin');

        $body = Response::jsonBody();
        $filename = $body['file'] ?? '';

        // ── Whitelist: only allow known import files ──
        $allowed = [
            'import_athletes.sql',
            'import_remaining_athletes.sql',
        ];

        if (!in_array($filename, $allowed, true)) {
            Response::error(
                "File non consentito. File validi: " . implode(', ', $allowed),
                403
            );
        }

        $uploadsDir = dirname(__DIR__, 3) . '/uploads/';
        $filePath = $uploadsDir . $filename;

        if (!file_exists($filePath)) {
            Response::error("File non trovato: {$filename}", 404);
        }

        $sql = file_get_contents($filePath);
        if ($sql === false || trim($sql) === '') {
            Response::error("File vuoto o non leggibile: {$filename}", 400);
        }

        $pdo = \FusionERP\Shared\Database::getInstance();

        // Split on semicolons (respecting quoted strings is non-trivial,
        // but these generated files use only simple INSERT/SET/SELECT)
        $statements = array_filter(
            array_map('trim', explode(';', $sql)),
        fn(string $s) => $s !== '' && !str_starts_with($s, '--')
        );

        $executed = 0;
        $errors = [];
        $warnings = [];

        // ── Wrap ALL statements in a single transaction for atomicity ──────────
        // If ANY statement fails, the entire import is rolled back to prevent
        // partial/corrupt state in the DB.
        $pdo->beginTransaction();
        try {
            foreach ($statements as $i => $stmt) {
                // SELECT statements (team checks) → capture output for warnings
                if (stripos(ltrim($stmt), 'SELECT') === 0) {
                    $row = $pdo->query($stmt)->fetch(\PDO::FETCH_NUM);
                    if ($row && isset($row[0]) && str_contains((string)$row[0], '⚠')) {
                        $warnings[] = $row[0];
                    }
                }
                else {
                    $pdo->exec($stmt);
                }
                $executed++;
            }
            $pdo->commit();
        }
        catch (\Throwable $e) {
            $pdo->rollBack();
            $errors[] = [
                'statement' => $executed + 1,
                'sql' => mb_substr((string)($statements[array_keys($statements)[$executed]] ?? ''), 0, 120) . '…',
                'error' => $e->getMessage(),
            ];
        }

        Audit::log('IMPORT', 'athletes', null, null, [
            'file' => $filename,
            'executed' => $executed,
            'errors' => count($errors),
        ]);

        Response::success([
            'file' => $filename,
            'total' => count($statements),
            'executed' => $executed,
            'errors' => $errors,
            'warnings' => $warnings,
            'message' => count($errors) === 0
            ? '✅ Import completato: ' . (string)$executed . ' istruzioni eseguite.'
            : '❌ Import annullato (rollback): errore allo statement #' . (string)($executed + 1) . '. Nessuna modifica applicata.',
        ]);
    }

    // ─── ADMIN DASHBOARD SUMMARY ──────────────────────────────────────────────

    /**
     * GET ?module=admin&action=adminSummary
     * Aggregate summary for the admin dashboard: users, backups, logs.
     * Requires manager role minimum.
     */
    public function adminSummary(): void
    {
        Auth::requireRole('social media manager');

        $users = $this->repo->getUsersSummary();
        $backups = $this->repo->getLastBackup();
        $logs = $this->repo->getLogsSummary();

        // DB size from backup stats (light query, no heavy scan)
        $dbStats = $this->repo->listDatabaseTables();
        $erpTables = array_values(array_filter($dbStats, fn($t) => !str_starts_with($t['table_name'], 'wp_')));
        $totalRows = (int)array_sum(array_column($erpTables, 'table_rows'));
        $totalBytes = (int)array_sum(array_column($erpTables, 'data_length'));

        Response::success([
            'users' => $users,
            'backups' => array_merge($backups, [
                'db_table_count' => count($erpTables),
                'db_total_rows' => $totalRows,
                'db_total_bytes' => $totalBytes,
            ]),
            'logs' => $logs,
        ]);
    }

    // ─── SYSTEM LOGS ────────────────────────────────────────────────────────

    /**
     * GET ?module=admin&action=listLogs
     * Optional query params: action, table_name, date_from, date_to, search, limit, offset
     */
    public function listLogs(): void
    {
        Auth::requireRole('social media manager');

        $action = filter_input(INPUT_GET, 'action', FILTER_DEFAULT) ?? '';
        $tableName = filter_input(INPUT_GET, 'table_name', FILTER_DEFAULT) ?? '';
        $dateFrom = filter_input(INPUT_GET, 'date_from', FILTER_DEFAULT) ?? '';
        $dateTo = filter_input(INPUT_GET, 'date_to', FILTER_DEFAULT) ?? '';
        $search = filter_input(INPUT_GET, 'search', FILTER_DEFAULT) ?? '';
        $limit = max(1, min(500, (int)(filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?: 200)));
        $offset = max(0, (int)(filter_input(INPUT_GET, 'offset', FILTER_VALIDATE_INT) ?: 0));

        // The 'action' GET param is also used by the router; for this endpoint the
        // filter action is passed as 'action_filter' to avoid collision.
        $actionFilter = filter_input(INPUT_GET, 'action_filter', FILTER_DEFAULT) ?? '';

        $logs = $this->repo->listLogs(
            $actionFilter,
            $tableName,
            $dateFrom,
            $dateTo,
            $search,
            $limit,
            $offset
        );

        Response::success([
            'logs' => $logs,
            'limit' => $limit,
            'offset' => $offset,
            'count' => count($logs),
        ]);
    }

    // ─── BACKUP ───────────────────────────────────────────────────────────────

    /**
     * GET ?module=admin&action=listBackups
     * Returns list of backup metadata records + DB table stats.
     */
    public function listBackups(): void
    {
        Auth::requireRole('social media manager');

        $backups = $this->repo->listBackupRecords();
        $tables = $this->repo->listDatabaseTables();

        $erpTables = array_values(array_filter($tables, fn($t) => !str_starts_with($t['table_name'], 'wp_')));
        $totalRows = (int)array_sum(array_column($erpTables, 'table_rows'));
        $totalBytes = (int)array_sum(array_column($erpTables, 'data_length'));

        Response::success([
            'backups' => $backups,
            'db_stats' => [
                'table_count' => count($erpTables),
                'total_rows' => $totalRows,
                'total_bytes' => $totalBytes,
                'tables' => $erpTables,
            ],
        ]);
    }

    /**
     * POST ?module=admin&action=createBackup
     * Generates a full SQL dump via PDO and compresses to ZIP.
     * After local save, uploads to Google Drive (if configured).
     */
    public function createBackup(): void
    {
        $user = Auth::requireRole('admin');
        $result = (new BackupService($this->repo))->dump($user['id'], $user['full_name'] ?? 'Admin');

        if (!$result['success']) {
            Response::error($result['error'], 500);
        }

        // ── Upload to Google Drive ─────────────────────────────────────────────
        $driveFileId = null;
        $driveError = null;
        $driveEnabled = !empty(getenv('GDRIVE_CLIENT_ID')) && !empty(getenv('GDRIVE_REFRESH_TOKEN'));

        if ($driveEnabled) {
            try {
                $driveFileId = GoogleDrive::uploadFile($result['filepath'], $result['filename']);
                $this->repo->updateBackupDriveInfo($result['id'], $driveFileId);
            }
            catch (\Throwable $e) {
                $driveError = $e->getMessage();
                error_log('[BACKUP] Drive upload failed: ' . $driveError);
            }
        }

        Response::success([
            'id' => $result['id'],
            'filename' => $result['filename'],
            'filesize' => $result['filesize'],
            'table_count' => count($result['table_names']),
            'row_count' => $result['total_rows'],
            'created_at' => date('Y-m-d H:i:s'),
            'drive_file_id' => $driveFileId,
            'drive_error' => $driveError,
        ], 201);
    }


    /**
     * GET ?module=admin&action=downloadBackup&id=BKP_xxxx
     * Streams the backup file directly to the browser.
     */
    public function downloadBackup(): void
    {
        Auth::requireRole('admin');

        $id = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($id)) {
            Response::error('ID backup mancante', 400);
        }

        $backup = $this->repo->getBackupById($id);
        if (!$backup) {
            Response::error('Backup non trovato', 404);
        }

        $storagePath = rtrim(getenv('BACKUP_STORAGE_PATH') ?: '/var/www/fusion/storage/backups/', '/') . '/';

        // ── Path-traversal guard ───────────────────────────────────────────────
        // Use basename() to strip any directory components, then verify the
        // resolved real path is within the expected storage directory.
        $safeFilename = basename((string)$backup['filename']);
        $filePath = $storagePath . $safeFilename;
        $realFile = realpath($filePath);
        $realStorage = realpath($storagePath);

        if ($realFile === false || $realStorage === false
        || !str_starts_with($realFile, $realStorage . DIRECTORY_SEPARATOR)) {
            Response::error('File di backup non valido', 403);
        }

        if (!file_exists($realFile)) {
            Response::error('File di backup non trovato sul server', 404);
        }

        // Stream file
        $mime = str_ends_with($safeFilename, '.zip') ? 'application/zip' : 'application/sql';
        header('Content-Type: ' . $mime);
        header('Content-Disposition: attachment; filename="' . $safeFilename . '"');
        header('Content-Length: ' . filesize($realFile));
        header('Cache-Control: no-cache, must-revalidate');
        readfile($realFile);
        exit;
    }

    /**
     * POST ?module=admin&action=deleteBackup
     * Body: { "id": "BKP_xxxx" }
     * Deletes backup file and metadata record.
     */
    public function deleteBackup(): void
    {
        Auth::requireRole('admin');

        $body = Response::jsonBody();
        $id = $body['id'] ?? '';

        if (empty($id)) {
            Response::error('ID backup mancante', 400);
        }

        $backup = $this->repo->getBackupById($id);
        if (!$backup) {
            Response::error('Backup non trovato', 404);
        }

        // Delete physical file — path-traversal guard (same logic as downloadBackup)
        $storagePath = rtrim(getenv('BACKUP_STORAGE_PATH') ?: '/var/www/fusion/storage/backups/', '/') . '/';
        $safeFilename = basename((string)$backup['filename']);
        $filePath = $storagePath . $safeFilename;
        $realFile = realpath($filePath);
        $realStorage = realpath($storagePath);

        if ($realFile !== false && $realStorage !== false
        && str_starts_with($realFile, $realStorage . DIRECTORY_SEPARATOR)
        && file_exists($realFile)) {
            unlink($realFile);
        }

        $this->repo->deleteBackupRecord($id);

        Audit::log('DELETE', 'backups', $id, $backup, null);

        Response::success(['deleted' => $id]);
    }
}