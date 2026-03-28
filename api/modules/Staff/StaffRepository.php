<?php
/**
 * Staff Repository — DB queries for staff_members table
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Staff;

// Explicit require_once needed because server uses optimized classmap autoloader
$_staffShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_staffShared . 'TenantContext.php';
unset($_staffShared);

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

class StaffRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }
    // ─── List all active staff members ────────────────────────────────────────
    public function listStaff(): array
    {
        $tenantId = TenantContext::id();
        $sql = "SELECT s.id, s.first_name, s.last_name,
                       CONCAT(s.first_name, ' ', s.last_name) AS full_name,
                       s.role, s.phone, s.email, s.medical_cert_expires_at,
                       s.photo_path, s.contract_status, s.contract_valid_from, s.contract_valid_to,
                       GROUP_CONCAT(ts.id SEPARATOR ',') as team_season_ids,
                       GROUP_CONCAT(COALESCE(CONCAT(t.category, ' — ', t.name), t.name) SEPARATOR ', ') as team_names
                FROM staff_members s
                LEFT JOIN staff_teams st ON s.id = st.staff_id
                LEFT JOIN team_seasons ts ON st.team_season_id = ts.id
                LEFT JOIN teams t ON ts.team_id = t.id AND t.deleted_at IS NULL
                WHERE s.tenant_id = :tenant_id AND s.is_deleted = 0
                GROUP BY s.id
                ORDER BY s.last_name ASC, s.first_name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':tenant_id' => $tenantId]);

        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['team_season_ids'] = $row['team_season_ids'] ? explode(',', $row['team_season_ids']) : [];
        }
        unset($row); // break reference from foreach
        return $rows;
    }

    // ─── Get single staff member by ID ────────────────────────────────────────
    public function getById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $sql = "SELECT s.*, CONCAT(s.first_name, ' ', s.last_name) AS full_name,
                       GROUP_CONCAT(ts.id SEPARATOR ',') as team_season_ids,
                       GROUP_CONCAT(COALESCE(CONCAT(t.category, ' — ', t.name), t.name) SEPARATOR ', ') as team_names
                FROM staff_members s
                LEFT JOIN staff_teams st ON s.id = st.staff_id
                LEFT JOIN team_seasons ts ON st.team_season_id = ts.id
                LEFT JOIN teams t ON ts.team_id = t.id AND t.deleted_at IS NULL
                WHERE s.id = :id AND s.tenant_id = :tenant_id AND s.is_deleted = 0
                GROUP BY s.id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id, ':tenant_id' => $tenantId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if ($row) {
            $row['team_season_ids'] = $row['team_season_ids'] ? explode(',', $row['team_season_ids']) : [];
        }
        return $row ?: null;
    }

    public function getByEmail(string $email): ?array
    {
        $tenantId = TenantContext::id();
        $sql = "SELECT s.*, CONCAT(s.first_name, ' ', s.last_name) AS full_name,
                       GROUP_CONCAT(ts.id SEPARATOR ',') as team_season_ids,
                       GROUP_CONCAT(COALESCE(CONCAT(t.category, ' — ', t.name), t.name) SEPARATOR ', ') as team_names
                FROM staff_members s
                LEFT JOIN staff_teams st ON s.id = st.staff_id
                LEFT JOIN team_seasons ts ON st.team_season_id = ts.id
                LEFT JOIN teams t ON ts.team_id = t.id AND t.deleted_at IS NULL
                WHERE s.email = :email AND s.tenant_id = :tenant_id AND s.is_deleted = 0
                GROUP BY s.id
                LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $email, ':tenant_id' => $tenantId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if ($row) {
            $row['team_season_ids'] = $row['team_season_ids'] ? explode(',', $row['team_season_ids']) : [];
        }
        return $row ?: null;
    }

    // ─── Create ───────────────────────────────────────────────────────────────
    public function create(array $data, array $teamIds = []): void
    {
        $this->db->beginTransaction();
        try {
            $sql = "INSERT INTO staff_members
                    (id, tenant_id, first_name, last_name, role,
                     birth_date, birth_place, residence_address, residence_city,
                     phone, email, fiscal_code, identity_document,
                     medical_cert_expires_at, notes)
                VALUES
                    (:id, :tenant_id, :first_name, :last_name, :role,
                     :birth_date, :birth_place, :residence_address, :residence_city,
                     :phone, :email, :fiscal_code, :identity_document,
                     :medical_cert_expires_at, :notes)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($data);

            if (!empty($teamIds)) {
                $sqlTeams = "INSERT INTO staff_teams (staff_id, team_season_id) VALUES (:staff_id, :team_season_id)";
                $stmtTeams = $this->db->prepare($sqlTeams);
                foreach ($teamIds as $tid) {
                    $stmtTeams->execute([':staff_id' => $data[':id'], ':team_season_id' => $tid]);
                }
            }
            $this->db->commit();
        }
        catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ─── Update ───────────────────────────────────────────────────────────────
    public function update(string $id, array $data, array $teamIds = []): void
    {
        $this->db->beginTransaction();
        try {
            $tenantId = TenantContext::id();
            $sql = "UPDATE staff_members SET
                    first_name              = :first_name,
                    last_name               = :last_name,
                    role                    = :role,
                    birth_date              = :birth_date,
                    birth_place             = :birth_place,
                    residence_address       = :residence_address,
                    residence_city          = :residence_city,
                    phone                   = :phone,
                    email                   = :email,
                    fiscal_code             = :fiscal_code,
                    identity_document       = :identity_document,
                    medical_cert_expires_at = :medical_cert_expires_at,
                    notes                   = :notes
                WHERE id = :id AND tenant_id = :tenant_id AND is_deleted = 0";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(array_merge($data, [':id' => $id, ':tenant_id' => $tenantId]));

            $this->db->prepare("DELETE FROM staff_teams WHERE staff_id = :staff_id")->execute([':staff_id' => $id]);

            if (!empty($teamIds)) {
                $sqlTeams = "INSERT INTO staff_teams (staff_id, team_season_id) VALUES (:staff_id, :team_season_id)";
                $stmtTeams = $this->db->prepare($sqlTeams);
                foreach ($teamIds as $tid) {
                    $stmtTeams->execute([':staff_id' => $id, ':team_season_id' => $tid]);
                }
            }

            $this->db->commit();
        }
        catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    // ─── Soft Delete ──────────────────────────────────────────────────────────
    public function softDelete(string $id): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare("UPDATE staff_members SET is_deleted = 1 WHERE id = :id AND tenant_id = :tenant_id");
        $stmt->execute([':id' => $id, ':tenant_id' => $tenantId]);
    }

    // ─── Public ───────────────────────────────────────────────────────────────
    public function getPublicStaffByTeam(string $teamId): array
    {
        $sql = "SELECT s.id, s.first_name, s.last_name,
                       CONCAT(s.first_name, ' ', s.last_name) AS full_name,
                       s.role, s.photo_path, s.fiscal_code
                FROM staff_members s
                INNER JOIN staff_teams st ON s.id = st.staff_id
                WHERE s.is_deleted = 0
                  AND st.team_season_id = :team_season_id
                ORDER BY s.last_name ASC, s.first_name ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':team_season_id' => $teamId]);

        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['gender'] = 'M'; // Default to Male if unknown
            if (!empty($row['fiscal_code']) && strlen($row['fiscal_code']) >= 11) {
                $dayStr = substr($row['fiscal_code'], 9, 2);
                if (is_numeric($dayStr)) {
                    $day = (int)$dayStr;
                    if ($day > 40) {
                        $row['gender'] = 'F';
                    }
                }
            }
            unset($row['fiscal_code']); // Security: do not expose fiscal code publicly
        }
        return $rows;
    }
    
    // ─── Photo and Contract Update Helpers ────────────────────────────────────
    public function updatePhoto(string $id, ?string $photoPath): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare("UPDATE staff_members SET photo_path = :photo_path WHERE id = :id AND tenant_id = :tenant_id AND is_deleted = 0");
        $stmt->execute([':photo_path' => $photoPath, ':id' => $id, ':tenant_id' => $tenantId]);
    }

    public function updateDocumentPath(string $id, string $field, ?string $path): void
    {
        // Allowlist the column name to prevent SQL injection
        $allowed = ['contract_file_path', 'id_doc_file_path', 'id_doc_back_file_path', 'cf_doc_file_path', 'cf_doc_back_file_path'];
        if (!in_array($field, $allowed, true)) {
            throw new \InvalidArgumentException("Campo documento non valido: $field");
        }
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare("UPDATE staff_members SET `$field` = :path WHERE id = :id AND tenant_id = :tenant_id AND is_deleted = 0");
        $stmt->execute([':path' => $path, ':id' => $id, ':tenant_id' => $tenantId]);
    }

    public function updateContractInfo(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $sql = "UPDATE staff_members SET 
                contract_status = :contract_status,
                contract_esign_document_id = :contract_esign_document_id,
                contract_esign_signing_url = :contract_esign_signing_url,
                contract_valid_from = :contract_valid_from,
                contract_valid_to = :contract_valid_to,
                contract_monthly_fee = :contract_monthly_fee,
                contract_signed_pdf_path = :contract_signed_pdf_path
                WHERE id = :id AND tenant_id = :tenant_id AND is_deleted = 0";
        
        $params = array_merge($data, [':id' => $id, ':tenant_id' => $tenantId]);
        
        // Handle optional values by providing default null if they aren't explicitly given in standard form
        $params[':contract_signed_pdf_path'] = $data[':contract_signed_pdf_path'] ?? null;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
    }
}