<?php
/**
 * ESignature Webhook Controller
 * Public endpoints for receiving status updates from OpenAPI.it
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\ESignature;

use FusionERP\Shared\Database;
use FusionERP\Shared\ESignatureService;
use FusionERP\Shared\Audit;

class ESignatureController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Webhook callback from OpenAPI.it when signature status changes.
     * Public endpoint, no auth required.
     * url: /api/router.php?module=esignature&action=callback
     */
    public function callback(): void
    {
        // OpenAPI uses POST and sometimes GET for redirects
        $documentId = $_GET['document_id'] ?? $_GET['id'] ?? '';
        $callbackStatus = $_GET['status'] ?? '';

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $rawBody = file_get_contents('php://input');
            error_log('[ESIGNATURE] webhook raw body: ' . substr($rawBody, 0, 500));
            $postData = json_decode($rawBody, true) ?: [];

            // Wrap logic for OpenAPI data object
            $callbackData = $postData['data'] ?? $postData;
            $documentId = $documentId ?: ($callbackData['id'] ?? $postData['document_id'] ?? '');
            $callbackStatus = $callbackStatus ?: ($callbackData['state'] ?? $callbackData['status'] ?? $postData['status'] ?? '');
        }

        if (empty($documentId)) {
            http_response_code(400);
            echo json_encode(['error' => 'document_id mancante']);
            exit();
        }

        error_log("[ESIGNATURE] callback received: doc={$documentId} status={$callbackStatus}");

        // Handle cancellations
        if (in_array(strtolower($callbackStatus), ['cancelled', 'canceled', 'cancel'])) {
            $this->updateStaffContractStatus($documentId, 'annullato');
            http_response_code(200);
            echo json_encode(['status' => 'ok', 'message' => 'Firma annullata registrata.']);
            exit();
        }

        // Handle completed signatures
        $downloadedPath = null;
        $statusResult = ESignatureService::getStatus($documentId);

        if ($statusResult['success'] && current($statusResult)['signed'] ?? false || $statusResult['signed'] ?? false) {
            $this->updateStaffContractStatus($documentId, 'firmato');
            
            // Try downloading it
            $docResult = ESignatureService::getSignedDocument($documentId);
            if ($docResult['success'] && !empty($docResult['pdf_content'])) {
                $uploadDir = dirname(__DIR__, 3) . '/storage/pdfs/contratti_firmati/';
                if (!is_dir($uploadDir)) {
                    mkdir($uploadDir, 0755, true);
                }
                
                $filename = 'contratto_firmato_staff_' . $documentId . '_' . date('Ymd_His') . '.pdf';
                $savePath = $uploadDir . $filename;

                if (file_put_contents($savePath, $docResult['pdf_content'])) {
                    $downloadedPath = 'storage/pdfs/contratti_firmati/' . $filename;
                    
                    // Update the row with the path
                    $stmt = $this->db->prepare("UPDATE staff_members SET contract_signed_pdf_path = ? WHERE contract_esign_document_id = ?");
                    $stmt->execute([$downloadedPath, $documentId]);
                }
            }
        }

        http_response_code(200);
        echo json_encode(['status' => 'ok', 'message' => 'Stato aggiornato']);
        exit();
    }

    private function updateStaffContractStatus(string $documentId, string $status): void
    {
        $stmt = $this->db->prepare("SELECT id, tenant_id FROM staff_members WHERE contract_esign_document_id = ? LIMIT 1");
        $stmt->execute([$documentId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($row) {
            $stmt = $this->db->prepare("UPDATE staff_members SET contract_status = ?, contract_signed_at = IF(? = 'firmato', NOW(), contract_signed_at) WHERE contract_esign_document_id = ?");
            $stmt->execute([$status, $status, $documentId]);
            
            Audit::log('UPDATE', 'staff_members', (string)$row['id'], null, [
                'contract_status' => $status,
                'contract_esign_document_id' => $documentId,
                'reason' => 'ESignature Webhook'
            ]);
        }
    }
}
