<?php
/**
 * Documents Repository — Athlete Document Management
 * Fusion ERP v1.0 — Module D
 */

declare(strict_types=1);

namespace FusionERP\Modules\Documents;

use FusionERP\Shared\Database;

class DocumentsRepository
{
    private \PDO $db;

    /** Document types enum */
    public const DOC_TYPES = [
        'ID_CARD', 'PASSPORT', 'FEDERATION_CARD', 'BIRTH_CERTIFICATE',
        'IMAGE_RELEASE', 'GDPR_CONSENT', 'MEDICAL_CERTIFICATE',
        'CONTRACT', 'SPORTS_LICENSE', 'OTHER',
    ];

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Insert a new document record.
     */
    public function insertDocument(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO athlete_documents (id, tenant_id, athlete_id, doc_type, file_name, file_path, upload_date, expiry_date, uploaded_by)
             VALUES (:id, :tenant_id, :athlete_id, :doc_type, :file_name, :file_path, NOW(), :expiry_date, :uploaded_by)'
        );
        $stmt->execute($data);
    }

    /**
     * List documents for an athlete. Filters by role:
     * - ADMIN/MEDICAL_STAFF: all documents
     * - COACH: only FEDERATION_CARD, IMAGE_RELEASE, SPORTS_LICENSE
     * - PARENT/ATHLETE: own docs only (caller must filter athlete_id)
     *
     * @param string $athleteId
     * @param string|null $docType Filter by type
     * @param array $allowedTypes Restricted types for role filtering
     * @return array
     */
    public function getDocuments(string $athleteId, ?string $docType = null, array $allowedTypes = []): array
    {
        $sql = 'SELECT id, doc_type, file_name, file_path, upload_date, expiry_date, uploaded_by
                FROM athlete_documents
                WHERE athlete_id = :athlete_id AND deleted_at IS NULL';
        $params = [':athlete_id' => $athleteId];

        if ($docType !== null) {
            $sql .= ' AND doc_type = :doc_type';
            $params[':doc_type'] = $docType;
        }

        if (!empty($allowedTypes)) {
            $placeholders = [];
            foreach ($allowedTypes as $i => $t) {
                $key = ':allowed_type_' . $i;
                $placeholders[] = $key;
                $params[$key] = $t;
            }
            $sql .= ' AND doc_type IN (' . implode(',', $placeholders) . ')';
        }

        $sql .= ' ORDER BY upload_date DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Get a single document by ID.
     */
    public function getDocumentById(string $docId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, athlete_id, doc_type, file_name, file_path, upload_date, expiry_date, uploaded_by
             FROM athlete_documents
             WHERE id = :id AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([':id' => $docId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Soft-delete a document.
     */
    public function softDeleteDocument(string $docId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE athlete_documents SET deleted_at = NOW() WHERE id = :id'
        );
        $stmt->execute([':id' => $docId]);
    }

    /**
     * Get documents expiring within N days across all athletes.
     * Used by cron alert system.
     */
    public function getExpiringDocuments(int $days = 30): array
    {
        $stmt = $this->db->prepare(
            "SELECT d.id, d.athlete_id, d.doc_type, d.file_name, d.expiry_date,
                    a.full_name, a.email, a.phone, a.parent_phone, a.tenant_id,
                    DATEDIFF(d.expiry_date, CURDATE()) AS days_until_expiry
             FROM athlete_documents d
             JOIN athletes a ON a.id = d.athlete_id
             WHERE d.deleted_at IS NULL
               AND d.expiry_date IS NOT NULL
               AND d.expiry_date <= DATE_ADD(CURDATE(), INTERVAL :days DAY)
               AND a.deleted_at IS NULL
               AND a.is_active = 1
             ORDER BY d.expiry_date ASC"
        );
        $stmt->bindValue(':days', $days, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}