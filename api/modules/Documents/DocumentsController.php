<?php
/**
 * Documents Controller — Athlete Document Upload/Download
 * Fusion ERP v1.0 — Module D
 *
 * Endpoints:
 *   POST ?module=documents&action=upload          — upload document (multipart)
 *   GET  ?module=documents&action=list&id=ATH_xxx — list documents
 *   GET  ?module=documents&action=download&docId= — download file
 *   POST ?module=documents&action=delete           — soft delete
 *   GET  ?module=documents&action=docTypes         — list valid doc types
 */

declare(strict_types=1);

namespace FusionERP\Modules\Documents;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class DocumentsController
{
    private DocumentsRepository $repo;

    /** Max upload size: 10 MB */
    private const MAX_FILE_SIZE = 10 * 1024 * 1024;

    /** Allowed MIME types */
    private const ALLOWED_MIMES = [
        'application/pdf',
        'image/jpeg', 'image/jpg',
        'image/png',
        'image/webp',
    ];

    public function __construct()
    {
        $this->repo = new DocumentsRepository();
    }

    // ─── POST ?module=documents&action=upload ────────────────────────────────

    /**
     * Upload a document for an athlete. Expects multipart/form-data.
     */
    public function upload(): void
    {
        Auth::requireWrite('documents');
        $user = Auth::user();

        $athleteId = $_POST['athlete_id'] ?? '';
        $docType = strtoupper($_POST['doc_type'] ?? '');
        $expiryDate = $_POST['expiry_date'] ?? null;

        if (empty($athleteId) || empty($docType)) {
            Response::error('athlete_id e doc_type sono obbligatori', 400);
        }

        if (!in_array($docType, DocumentsRepository::DOC_TYPES, true)) {
            Response::error("Tipo documento non valido: {$docType}", 400);
        }

        // Validate file upload
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            $errorCode = $_FILES['file']['error'] ?? -1;
            Response::error("Errore upload file (codice: {$errorCode})", 400);
        }

        $file = $_FILES['file'];

        // Check file size
        if ($file['size'] > self::MAX_FILE_SIZE) {
            Response::error('File troppo grande (max 10 MB)', 400);
        }

        // Check MIME type
        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($file['tmp_name']);
        if (!in_array($mime, self::ALLOWED_MIMES, true)) {
            Response::error("Tipo file non consentito: {$mime}. Accettati: PDF, JPG, PNG, WEBP", 400);
        }

        // Create upload directory
        $safeAthleteId = basename(preg_replace('/[^A-Za-z0-9_]/', '', $athleteId));
        $uploadDir = dirname(__DIR__, 3) . '/uploads/documents/' . $safeAthleteId;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate unique filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $safeFileName = $docType . '_' . date('Ymd_His') . '_' . bin2hex(random_bytes(3)) . '.' . $ext;
        $destPath = $uploadDir . '/' . $safeFileName;

        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            Response::error('Errore nel salvataggio del file', 500);
        }

        // Relative path for DB
        $relPath = 'uploads/documents/' . $safeAthleteId . '/' . $safeFileName;

        $docId = 'DOC_' . bin2hex(random_bytes(4));
        $tenantId = TenantContext::id();

        $this->repo->insertDocument([
            ':id' => $docId,
            ':tenant_id' => $tenantId,
            ':athlete_id' => $athleteId,
            ':doc_type' => $docType,
            ':file_name' => $file['name'],
            ':file_path' => $relPath,
            ':expiry_date' => $expiryDate ?: null,
            ':uploaded_by' => $user['id'] ?? null,
        ]);

        Audit::log('INSERT', 'athlete_documents', $docId, null, [
            'athlete_id' => $athleteId,
            'doc_type' => $docType,
            'file_name' => $file['name'],
        ]);

        Response::success(['id' => $docId, 'file_path' => $relPath], 201);
    }

    // ─── GET ?module=documents&action=list&id=ATH_xxx ────────────────────────

    /**
     * List documents for an athlete, filtered by role.
     */
    public function list(): void
    {
        Auth::requireRead('documents');
        $user = Auth::user();
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        $docType = filter_input(INPUT_GET, 'type', FILTER_SANITIZE_SPECIAL_CHARS);

        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        // Role-based document type filtering
        $role = $user['role'] ?? '';
        $allowedTypes = [];

        if ($role === 'allenatore') {
            // Coach can only see federation card, image release, sports license
            $allowedTypes = ['FEDERATION_CARD', 'IMAGE_RELEASE', 'SPORTS_LICENSE'];
        }
        // admin, operatore, medico, manager: see all
        // genitore, atleta: see all of own (caller already filters by athleteId)

        $docs = $this->repo->getDocuments($athleteId, $docType ?: null, $allowedTypes);
        Response::success($docs);
    }

    // ─── GET ?module=documents&action=download&docId=DOC_xxx ─────────────────

    /**
     * Download a document file.
     */
    public function download(): void
    {
        Auth::requireRead('documents');
        $docId = filter_input(INPUT_GET, 'docId', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';

        if (empty($docId)) {
            Response::error('docId obbligatorio', 400);
        }

        $doc = $this->repo->getDocumentById($docId);
        if (!$doc) {
            Response::error('Documento non trovato', 404);
        }

        $filePath = dirname(__DIR__, 3) . '/' . $doc['file_path'];
        if (!file_exists($filePath)) {
            Response::error('File non trovato sul server', 404);
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $mime = $finfo->file($filePath);

        header('Content-Type: ' . $mime);
        header('Content-Disposition: inline; filename="' . basename($doc['file_name']) . '"');
        header('Content-Length: ' . filesize($filePath));
        header('Cache-Control: private, max-age=3600');
        readfile($filePath);
        exit;
    }

    // ─── POST ?module=documents&action=delete ────────────────────────────────

    /**
     * Soft-delete a document with audit log.
     */
    public function delete(): void
    {
        Auth::requireWrite('documents');
        $body = Response::jsonBody();
        $docId = $body['doc_id'] ?? '';

        if (empty($docId)) {
            Response::error('doc_id obbligatorio', 400);
        }

        $doc = $this->repo->getDocumentById($docId);
        if (!$doc) {
            Response::error('Documento non trovato', 404);
        }

        $this->repo->softDeleteDocument($docId);

        Audit::log('DELETE', 'athlete_documents', $docId, $doc, null);
        Response::success(['message' => 'Documento eliminato']);
    }

    // ─── GET ?module=documents&action=docTypes ───────────────────────────────

    /**
     * Return the list of valid document types (for frontend selects).
     */
    public function docTypes(): void
    {
        Auth::requireRead('documents');
        Response::success(DocumentsRepository::DOC_TYPES);
    }
}