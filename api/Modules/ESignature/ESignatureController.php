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
use FusionERP\Shared\Response;

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
            $postData = json_decode($rawBody, true) ?: [];

            $callbackData = $postData['data'] ?? $postData;
            $documentId = $documentId ?: ($callbackData['id'] ?? $postData['document_id'] ?? '');
            $callbackStatus = $callbackStatus ?: ($callbackData['state'] ?? $callbackData['status'] ?? $postData['status'] ?? '');
        }

        if (empty($documentId)) {
            Response::error('document_id mancante', 400);
        }


        // Handle cancellations
        if (in_array(strtolower($callbackStatus), ['cancelled', 'canceled', 'cancel'])) {
            $this->updateStaffContractStatus($documentId, 'annullato');
            Response::success(['status' => 'ok', 'message' => 'Firma annullata registrata.']);
        }

        // Handle completed signatures
        $downloadedPath = null;
        $statusResult = ESignatureService::getStatus($documentId);

        if (!empty($statusResult['success']) && !empty($statusResult['signed'])) {
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

        Response::success(['status' => 'ok', 'message' => 'Stato aggiornato']);
    }

    private function updateStaffContractStatus(string $documentId, string $status): void
    {
        $stmt = $this->db->prepare("SELECT id, tenant_id FROM staff_members WHERE contract_esign_document_id = ? LIMIT 1");
        $stmt->execute([$documentId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($row) {
            $stmt = $this->db->prepare(
                "UPDATE staff_members
                 SET contract_status = :status,
                     contract_signed_at = IF(:s2 = 'firmato', NOW(), contract_signed_at)
                 WHERE contract_esign_document_id = :doc_id
                   AND tenant_id = :tenant_id"
            );
            $stmt->execute([
                ':status'    => $status,
                ':s2'        => $status,
                ':doc_id'    => $documentId,
                ':tenant_id' => $row['tenant_id'],
            ]);

            Audit::log('UPDATE', 'staff_members', (string)$row['id'], null, [
                'contract_status'             => $status,
                'contract_esign_document_id'  => $documentId,
                'reason'                      => 'ESignature Webhook',
            ]);
        }
    }
}
