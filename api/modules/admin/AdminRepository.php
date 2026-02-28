<?php
/**
 * Admin Repository — Medical Certs, Contracts, Documents
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Admin;

use FusionERP\Shared\Database;

class AdminRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── MEDICAL CERTIFICATES ─────────────────────────────────────────────────

    public function listCertificates(string $athleteId = '', bool $expiringSoon = false): array
    {
        $sql = 'SELECT mc.id, mc.athlete_id, mc.type, mc.issue_date, mc.expiry_date,
                       mc.ocr_extracted_date, mc.file_path, mc.status, mc.notes,
                       a.full_name AS athlete_name, t.name AS team_name, t.category
                FROM medical_certificates mc
                JOIN athletes a ON a.id = mc.athlete_id
                JOIN teams t ON t.id = a.team_id
                WHERE mc.deleted_at IS NULL';
        $params = [];
        if ($athleteId !== '') {
            $sql .= ' AND mc.athlete_id = :athlete_id';
            $params[':athlete_id'] = $athleteId;
        }
        if ($expiringSoon) {
            $sql .= ' AND mc.expiry_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) AND mc.status = \'active\'';
        }
        $sql .= ' ORDER BY mc.expiry_date ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function createCertificate(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO medical_certificates
             (id, athlete_id, type, expiry_date, ocr_extracted_date, file_path, original_filename, uploaded_by)
             VALUES (:id, :athlete_id, :type, :expiry_date, :ocr_date, :file_path, :orig_name, :uploaded_by)'
        );
        $stmt->execute($data);
    }

    public function revokeCertificate(string $id): void
    {
        $stmt = $this->db->prepare('UPDATE medical_certificates SET status = \'revoked\' WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    public function getCertificateById(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM medical_certificates WHERE id = :id AND deleted_at IS NULL LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    // ─── CONTRACTS ────────────────────────────────────────────────────────────

    public function listContracts(string $userId = ''): array
    {
        $sql = 'SELECT c.id, c.user_id, c.type, c.role_description, c.valid_from, c.valid_to,
                       c.monthly_fee_eur, c.pdf_path, c.status, c.signed_at,
                       u.full_name AS user_name, u.email AS user_email
                FROM contracts c
                JOIN users u ON u.id = c.user_id
                WHERE c.deleted_at IS NULL';
        $params = [];
        if ($userId !== '') {
            $sql .= ' AND c.user_id = :user_id';
            $params[':user_id'] = $userId;
        }
        $sql .= ' ORDER BY c.valid_from DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function createContract(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO contracts (id, user_id, type, role_description, valid_from, valid_to, monthly_fee_eur, status, created_by)
             VALUES (:id, :user_id, :type, :role_description, :valid_from, :valid_to, :monthly_fee_eur, \'draft\', :created_by)'
        );
        $stmt->execute($data);
    }

    public function updateContractPdf(string $id, string $pdfPath): void
    {
        $stmt = $this->db->prepare('UPDATE contracts SET pdf_path = :path WHERE id = :id');
        $stmt->execute([':path' => $pdfPath, ':id' => $id]);
    }

    public function getUserById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, full_name, email, role, phone FROM users WHERE id = :id AND deleted_at IS NULL LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }
}