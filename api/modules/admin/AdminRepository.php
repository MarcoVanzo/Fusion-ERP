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
        $stmt = $this->db->prepare('SELECT id, athlete_id, type, issue_date, expiry_date, ocr_extracted_date, file_path, original_filename, status, notes, uploaded_by, created_at, updated_at FROM medical_certificates WHERE id = :id AND deleted_at IS NULL LIMIT 1');
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

    // ─── AUDIT LOGS ──────────────────────────────────────────────────────────

    /**
     * List audit log entries with optional filters.
     *
     * @param string $action     Filter by action type (empty = all)
     * @param string $tableName  Filter by table name (empty = all)
     * @param string $dateFrom   Filter from date YYYY-MM-DD (empty = no lower bound)
     * @param string $dateTo     Filter to date YYYY-MM-DD (empty = no upper bound)
     * @param string $search     Search in user full_name or record_id
     * @param int    $limit      Page size
     * @param int    $offset     Page offset
     */
    public function listLogs(
        string $action = '',
        string $tableName = '',
        string $dateFrom = '',
        string $dateTo = '',
        string $search = '',
        int $limit = 200,
        int $offset = 0
        ): array
    {
        $sql = '
            SELECT
                al.id,
                al.user_id,
                u.full_name  AS user_name,
                al.action,
                al.table_name,
                al.record_id,
                al.before_snapshot,
                al.after_snapshot,
                al.ip_address,
                al.created_at
            FROM audit_logs al
            LEFT JOIN users u ON u.id = al.user_id
            WHERE 1=1';

        $params = [];

        if ($action !== '') {
            $sql .= ' AND al.action = :action';
            $params[':action'] = $action;
        }
        if ($tableName !== '') {
            $sql .= ' AND al.table_name = :table_name';
            $params[':table_name'] = $tableName;
        }
        if ($dateFrom !== '') {
            $sql .= ' AND al.created_at >= :date_from';
            $params[':date_from'] = $dateFrom . ' 00:00:00';
        }
        if ($dateTo !== '') {
            $sql .= ' AND al.created_at <= :date_to';
            $params[':date_to'] = $dateTo . ' 23:59:59';
        }
        if ($search !== '') {
            $sql .= ' AND (u.full_name LIKE :search OR al.record_id LIKE :search2)';
            $params[':search'] = '%' . $search . '%';
            $params[':search2'] = '%' . $search . '%';
        }

        $sql .= ' ORDER BY al.created_at DESC';
        $sql .= ' LIMIT ' . $limit . ' OFFSET ' . $offset;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    // ─── BACKUPS ──────────────────────────────────────────────────────────────

    /**
     * Return all user tables in the current database with row counts.
     * @return array<array{table_name:string,table_rows:int,data_length:int}>
     */
    public function listDatabaseTables(): array
    {
        $dbName = getenv('DB_NAME') ?: 'fusion_erp';
        try {
            $stmt = $this->db->prepare(
                'SELECT TABLE_NAME AS table_name,
                        IFNULL(TABLE_ROWS, 0) AS table_rows,
                        IFNULL(DATA_LENGTH + INDEX_LENGTH, 0) AS data_length
                 FROM INFORMATION_SCHEMA.TABLES
                 WHERE TABLE_SCHEMA = :dbname
                   AND TABLE_TYPE = \'BASE TABLE\'
                 ORDER BY TABLE_NAME'
            );
            $stmt->execute([':dbname' => $dbName]);
            return $stmt->fetchAll();
        }
        catch (\PDOException $e) {
            // Fallback: use SHOW TABLES if INFORMATION_SCHEMA access is restricted
            error_log('[BACKUP] INFORMATION_SCHEMA failed, using SHOW TABLES: ' . $e->getMessage());
            $tables = [];
            try {
                $rows = $this->db->query('SHOW TABLES')->fetchAll(\PDO::FETCH_COLUMN);
                foreach ($rows as $tbl) {
                    $tables[] = ['table_name' => $tbl, 'table_rows' => 0, 'data_length' => 0];
                }
            }
            catch (\PDOException $e2) {
                error_log('[BACKUP] SHOW TABLES also failed: ' . $e2->getMessage());
            }
            return $tables;
        }
    }

    /** Insert backup metadata row. */
    public function saveBackupRecord(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO backups
                 (id, filename, filesize, tables_list, table_count, row_count,
                  created_by, status, notes, drive_file_id, drive_uploaded_at)
             VALUES
                 (:id, :filename, :filesize, :tables_list, :table_count, :row_count,
                  :created_by, :status, :notes, :drive_file_id, :drive_uploaded_at)'
        );
        $stmt->execute($data);
    }

    /** Update an existing backup record with Google Drive info after upload. */
    public function updateBackupDriveInfo(string $id, string $driveFileId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE backups
             SET drive_file_id = :drive_file_id,
                 drive_uploaded_at = NOW()
             WHERE id = :id'
        );
        $stmt->execute([':drive_file_id' => $driveFileId, ':id' => $id]);
    }

    /** List all backup records, newest first. */
    public function listBackupRecords(): array
    {
        $stmt = $this->db->prepare(
            'SELECT b.id, b.filename, b.filesize, b.tables_list, b.table_count, b.row_count,
                    b.status, b.notes, b.created_at,
                    b.drive_file_id, b.drive_uploaded_at,
                    u.full_name AS created_by_name
             FROM backups b
             LEFT JOIN users u ON u.id = b.created_by
             ORDER BY b.created_at DESC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /** Delete a single backup record. */
    public function deleteBackupRecord(string $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM backups WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    /** Get a single backup record by ID. */
    public function getBackupById(string $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM backups WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch() ?: null;
    }

    // ─── DASHBOARD SUMMARY ────────────────────────────────────────────────────

    /**
     * Returns user counts broken down by status and by role.
     * @return array{total:int, by_status:array, by_role:array}
     */
    public function getUsersSummary(): array
    {
        // Total + by status
        $byStatus = $this->db->query(
            "SELECT
                SUM(CASE WHEN status = 'Attivo'      THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN status = 'Invitato'    THEN 1 ELSE 0 END) AS invited,
                SUM(CASE WHEN status = 'Disattivato' THEN 1 ELSE 0 END) AS disabled,
                COUNT(*) AS total
             FROM users
             WHERE deleted_at IS NULL"
        )->fetch(\PDO::FETCH_ASSOC);

        // By role
        $roleRows = $this->db->query(
            "SELECT role, COUNT(*) AS cnt
             FROM users
             WHERE deleted_at IS NULL
             GROUP BY role
             ORDER BY cnt DESC"
        )->fetchAll(\PDO::FETCH_ASSOC);

        return [
            'total' => (int)($byStatus['total'] ?? 0),
            'active' => (int)($byStatus['active'] ?? 0),
            'invited' => (int)($byStatus['invited'] ?? 0),
            'disabled' => (int)($byStatus['disabled'] ?? 0),
            'by_role' => $roleRows,
        ];
    }

    /**
     * Returns the last 10 audit log entries + action distribution for today.
     * @return array{recent:array, by_action:array}
     */
    public function getLogsSummary(): array
    {
        $recent = $this->db->query(
            "SELECT al.id, al.action, al.table_name, al.record_id,
                    al.ip_address, al.created_at,
                    u.full_name AS user_name
             FROM audit_logs al
             LEFT JOIN users u ON u.id = al.user_id
             ORDER BY al.created_at DESC
             LIMIT 10"
        )->fetchAll(\PDO::FETCH_ASSOC);

        $byAction = $this->db->query(
            "SELECT action, COUNT(*) AS cnt
             FROM audit_logs
             WHERE DATE(created_at) = CURDATE()
             GROUP BY action
             ORDER BY cnt DESC"
        )->fetchAll(\PDO::FETCH_ASSOC);

        $totalToday = (int)array_sum(array_column($byAction, 'cnt'));

        return [
            'recent' => $recent,
            'by_action' => $byAction,
            'total_today' => $totalToday,
        ];
    }

    /**
     * Returns last backup record + total backup count.
     * @return array{last:array|null, total:int}
     */
    public function getLastBackup(): array
    {
        $last = $this->db->query(
            "SELECT b.id, b.filename, b.filesize, b.table_count, b.row_count,
                    b.status, b.created_at, b.drive_file_id,
                    u.full_name AS created_by_name
             FROM backups b
             LEFT JOIN users u ON u.id = b.created_by
             ORDER BY b.created_at DESC
             LIMIT 1"
        )->fetch(\PDO::FETCH_ASSOC) ?: null;

        $total = (int)$this->db->query("SELECT COUNT(*) FROM backups")->fetchColumn();

        return [
            'last' => $last,
            'total' => $total,
        ];
    }
}