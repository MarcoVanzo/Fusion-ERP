<?php
/**
 * Health Repository — Medical Certificates & Injury Records
 * Fusion ERP v1.0 — Module C
 */

declare(strict_types=1);

namespace FusionERP\Modules\Health;

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

class HealthRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── MEDICAL CERTIFICATE ─────────────────────────────────────────────────

    /**
     * Update the medical certificate fields on the athlete record.
     */
    public function updateCertificate(string $athleteId, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE athletes
             SET medical_cert_type = :cert_type,
                 medical_cert_expires_at = :expires_at,
                 medical_cert_issued_at = :issued_at,
                 medical_cert_file_path = :file_path
             WHERE id = :id AND tenant_id = :tenant_id AND deleted_at IS NULL'
        );
        $data[':id'] = $athleteId;
        $data[':tenant_id'] = TenantContext::id();
        $stmt->execute($data);
    }

    /**
     * Get certificate status for an athlete.
     * @return array
     */
    public function getCertificateStatus(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT medical_cert_type AS cert_type,
                    medical_cert_expires_at AS expires_at,
                    medical_cert_issued_at AS issued_at,
                    medical_cert_file_path AS file_path
             FROM athletes
             WHERE id = :id AND tenant_id = :tenant_id AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([':id' => $athleteId, ':tenant_id' => TenantContext::id()]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$row || empty($row['expires_at'])) {
            return [
                'cert_type' => $row['cert_type'] ?? null,
                'expires_at' => null,
                'issued_at' => $row['issued_at'] ?? null,
                'file_path' => $row['file_path'] ?? null,
                'valid' => false,
                'days_until_expiry' => null,
                'alert' => 'NONE',
            ];
        }

        $expiry = new \DateTime($row['expires_at']);
        $today = new \DateTime();
        $diff = (int)$today->diff($expiry)->format('%r%a');
        $valid = $diff >= 0;

        $alert = match (true) {
                $diff < 0 => 'EXPIRED',
                $diff <= 7 => 'URGENT_7',
                $diff <= 15 => 'WARNING_15',
                $diff <= 30 => 'WARNING_30',
                default => 'NONE',
            };

        return [
            'cert_type' => $row['cert_type'],
            'expires_at' => $row['expires_at'],
            'issued_at' => $row['issued_at'],
            'file_path' => $row['file_path'],
            'valid' => $valid,
            'days_until_expiry' => $diff,
            'alert' => $alert,
        ];
    }

    /**
     * Get all athletes with certificates expiring within N days.
     * Used by the cron job for alert notifications.
     */
    public function getExpiringCertificates(int $days = 30): array
    {
        $stmt = $this->db->prepare(
            "SELECT a.id AS athlete_id, a.full_name, a.email, a.phone,
                    a.medical_cert_type, a.medical_cert_expires_at,
                    a.tenant_id, a.parent_contact, a.parent_phone,
                    DATEDIFF(a.medical_cert_expires_at, CURDATE()) AS days_until_expiry
             FROM athletes a
             WHERE a.deleted_at IS NULL
               AND a.is_active = 1
               AND a.medical_cert_expires_at IS NOT NULL
               AND a.medical_cert_expires_at <= DATE_ADD(CURDATE(), INTERVAL :days DAY)
             ORDER BY a.medical_cert_expires_at ASC"
        );
        $stmt->bindValue(':days', $days, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    // ─── ANAMNESI (MEDICAL & ORTHOPEDIC HISTORY) ─────────────────────────────

    public function getAnamnesi(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT blood_group, allergies, medications, chronic_diseases,
                    past_surgeries, past_injuries, chronic_orthopedic_issues, orthopedic_aids
             FROM athletes
             WHERE id = :id AND tenant_id = :tenant_id AND deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([':id' => $athleteId, ':tenant_id' => TenantContext::id()]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: [];
    }

    public function updateAnamnesi(string $athleteId, array $data): void
    {
        $stmt = $this->db->prepare(
            'UPDATE athletes
             SET blood_group = :blood_group,
                 allergies = :allergies,
                 medications = :medications,
                 chronic_diseases = :chronic_diseases,
                 past_surgeries = :past_surgeries,
                 past_injuries = :past_injuries,
                 chronic_orthopedic_issues = :chronic_orthopedic_issues,
                 orthopedic_aids = :orthopedic_aids
             WHERE id = :id AND tenant_id = :tenant_id AND deleted_at IS NULL'
        );
        $data[':id'] = $athleteId;
        $data[':tenant_id'] = TenantContext::id();
        $stmt->execute($data);
    }

    // ─── INJURIES ────────────────────────────────────────────────────────────

    /**
     * Insert a new injury record.
     */
    public function insertInjury(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO injury_records (
                id, tenant_id, athlete_id, injury_date, type, body_part, severity, stop_days, return_date, notes, treated_by, created_by,
                location_context, side, mechanism, official_diagnosis, diagnosis_date, diagnosed_by, instrumental_tests, test_results,
                is_recurrence, treatment_type, surgery_date, physio_plan, assigned_physio, current_status, estimated_recovery_time, estimated_return_date, medical_clearance_given
             )
             VALUES (
                :id, :tenant_id, :athlete_id, :injury_date, :type, :body_part, :severity, :stop_days, :return_date, :notes, :treated_by, :created_by,
                :location_context, :side, :mechanism, :official_diagnosis, :diagnosis_date, :diagnosed_by, :instrumental_tests, :test_results,
                :is_recurrence, :treatment_type, :surgery_date, :physio_plan, :assigned_physio, :current_status, :estimated_recovery_time, :estimated_return_date, :medical_clearance_given
             )'
        );
        $stmt->execute($data);
    }

    /**
     * Get the injury history for an athlete.
     */
    public function getInjuries(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT ir.*, 
                    (SELECT COUNT(*) FROM injury_followups WHERE injury_id = ir.id) as visit_count,
                    (SELECT COUNT(*) FROM injury_documents WHERE injury_id = ir.id) as doc_count
             FROM injury_records ir
             WHERE ir.athlete_id = :athlete_id AND ir.tenant_id = :tenant_id
             ORDER BY ir.injury_date DESC'
        );
        $stmt->execute([':athlete_id' => $athleteId, ':tenant_id' => TenantContext::id()]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Update injury (e.g. mark return date).
     */
    public function updateInjury(string $injuryId, array $data): void
    {
        $data[':id'] = $injuryId;
        $data[':tenant_id'] = TenantContext::id();
        // Costruzione dinamica dell'update
        $sets = [];
        foreach ($data as $key => $value) {
            if ($key === ':id' || $key === ':tenant_id') continue;
            $colName = ltrim($key, ':');
            $sets[] = "`$colName` = $key";
        }
        $setString = implode(', ', $sets);

        $stmt = $this->db->prepare(
            "UPDATE injury_records SET $setString WHERE id = :id AND tenant_id = :tenant_id"
        );
        $stmt->execute($data);
    }

    // ─── FOLLOW-UPS (INJURY VISITS) ──────────────────────────────────────────

    public function getInjuryFollowups(string $tenantId, string $injuryId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM injury_followups
             WHERE tenant_id = :tid AND injury_id = :iid
             ORDER BY visit_date DESC, id DESC LIMIT 200'
        );
        $stmt->execute([':tid' => $tenantId, ':iid' => $injuryId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function addInjuryFollowup(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO injury_followups (tenant_id, injury_id, visit_date, practitioner, notes, outcome)
             VALUES (:tenant_id, :injury_id, :visit_date, :practitioner, :notes, :outcome)'
        );
        $stmt->execute([
            ':tenant_id' => $data['tenant_id'],
            ':injury_id' => $data['injury_id'],
            ':visit_date' => $data['visit_date'],
            ':practitioner' => $data['practitioner'] ?? null,
            ':notes' => $data['notes'] ?? null,
            ':outcome' => $data['outcome'] ?? null
        ]);
    }

    // ─── INJURY DOCUMENTS ────────────────────────────────────────────────────

    public function getInjuryDocuments(string $tenantId, string $injuryId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM injury_documents
             WHERE tenant_id = :tid AND injury_id = :iid
             ORDER BY uploaded_at DESC LIMIT 200'
        );
        $stmt->execute([':tid' => $tenantId, ':iid' => $injuryId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function addInjuryDocument(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO injury_documents (tenant_id, injury_id, document_title, document_type, file_path)
             VALUES (:tenant_id, :injury_id, :title, :type, :file_path)'
        );
        $stmt->execute([
            ':tenant_id' => $data['tenant_id'],
            ':injury_id' => $data['injury_id'],
            ':title' => $data['document_title'],
            ':type' => $data['document_type'] ?? null,
            ':file_path' => $data['file_path']
        ]);
    }

    /**
     * Get a global health summary for the Athletes Dashboard.
     * Scoped to the current tenant to prevent cross-tenant data leaks.
     *
     * @param string $tenantId  The tenant to scope results to
     */
    public function getGlobalSummary(string $tenantId): array
    {
        $stats = [
            'active_injuries' => 0,
            'expired_certificates' => 0,
            'expiring_soon_certificates' => 0,
        ];

        // 1. Active injuries (return_date IS NULL) — scoped to tenant via athletes join
        $stmt = $this->db->prepare(
            'SELECT COUNT(*)
             FROM injury_records ir
             JOIN athletes a ON a.id = ir.athlete_id
             WHERE ir.return_date IS NULL
               AND a.deleted_at IS NULL
               AND a.tenant_id = :tid'
        );
        $stmt->execute([':tid' => $tenantId]);
        $stats['active_injuries'] = (int)$stmt->fetchColumn();

        // 2. Expired certificates — scoped to tenant
        $stmt = $this->db->prepare(
            'SELECT COUNT(*)
             FROM athletes
             WHERE deleted_at IS NULL
               AND is_active = 1
               AND tenant_id = :tid
               AND medical_cert_expires_at < CURDATE()'
        );
        $stmt->execute([':tid' => $tenantId]);
        $stats['expired_certificates'] = (int)$stmt->fetchColumn();

        // 3. Expiring soon (next 15 days) — scoped to tenant
        $stmt = $this->db->prepare(
            'SELECT COUNT(*)
             FROM athletes
             WHERE deleted_at IS NULL
               AND is_active = 1
               AND tenant_id = :tid
               AND medical_cert_expires_at BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 15 DAY)'
        );
        $stmt->execute([':tid' => $tenantId]);
        $stats['expiring_soon_certificates'] = (int)$stmt->fetchColumn();

        return $stats;
    }
}