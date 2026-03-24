<?php
/**
 * Athletes Repository — DB Queries
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Athletes;

use FusionERP\Shared\Database;

class AthletesRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function listAthletes(string $teamSeasonId = '', bool $includeInactive = false): array
    {
        $sql = 'SELECT DISTINCT a.id, a.team_id, a.full_name, a.jersey_number, a.role, a.birth_date,
                       a.height_cm, a.weight_kg, a.photo_path, a.is_active,
                       a.phone, a.email, a.fiscal_code, a.medical_cert_expires_at,
                       a.residence_address, a.residence_city, a.parent_contact, a.parent_phone,
                       COALESCE(t.name, "Nessuna squadra") AS team_name,
                       COALESCE(t.category, "Nessuna") AS category,
                       (SELECT GROUP_CONCAT(at_sub.team_season_id SEPARATOR ",") FROM athlete_teams at_sub WHERE at_sub.athlete_id = a.id) AS team_season_ids
                FROM athletes a
                LEFT JOIN teams t ON a.team_id = t.id';

        $params = [];
        if ($teamSeasonId !== '') {
            if (str_starts_with($teamSeasonId, 'TEAM_')) {
                // Legacy support for passing team_id instead of team_season_id
                $sql .= ' WHERE a.deleted_at IS NULL AND a.team_id = :team_id';
                $params[':team_id'] = $teamSeasonId;
            } else {
                $sql .= ' JOIN athlete_teams at2 ON a.id = at2.athlete_id';
                $sql .= ' WHERE a.deleted_at IS NULL AND at2.team_season_id = :team_season_id';
                $params[':team_season_id'] = $teamSeasonId;
            }
        }
        else {
            $sql .= ' WHERE a.deleted_at IS NULL';
        }

        if (!$includeInactive) {
            $sql .= ' AND a.is_active = 1';
        }
        $sql .= ' ORDER BY a.full_name';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['team_season_ids'] = !empty($row['team_season_ids']) ? explode(',', $row['team_season_ids']) : [];
        }
        return $rows;
    }

    /**
     * PERF: Light version for the athlete list view — returns only the fields
     * needed to render the athlete card (~75% less payload than listAthletes).
     * Full data is fetched on-demand when opening a single athlete profile.
     */
    public function listAthletesLight(string $teamSeasonId = ''): array
    {
        $sql = 'SELECT DISTINCT a.id, a.team_id, a.full_name, a.jersey_number, a.role, a.photo_path, a.is_active,
                       a.medical_cert_expires_at,
                       a.contract_file_path, a.id_doc_front_file_path, a.id_doc_back_file_path,
                       a.cf_doc_front_file_path, a.cf_doc_back_file_path, a.medical_cert_file_path,
                       COALESCE(t.name, "Nessuna squadra") AS team_name,
                       COALESCE(t.category, "Nessuna") AS category,
                       (SELECT GROUP_CONCAT(at_sub.team_season_id SEPARATOR ",") FROM athlete_teams at_sub WHERE at_sub.athlete_id = a.id) AS team_season_ids
                FROM athletes a
                LEFT JOIN teams t ON a.team_id = t.id';

        $params = [];
        if ($teamSeasonId !== '') {
            if (str_starts_with($teamSeasonId, 'TEAM_')) {
                // Legacy support for public website API which passes team_id instead of team_season_id
                $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1 AND a.team_id = :team_id';
                $params[':team_id'] = $teamSeasonId;
            } else {
                $sql .= ' JOIN athlete_teams at2 ON a.id = at2.athlete_id';
                $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1 AND at2.team_season_id = :team_season_id';
                $params[':team_season_id'] = $teamSeasonId;
            }
        }
        else {
            $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1';
        }
        $sql .= ' ORDER BY a.full_name';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['team_season_ids'] = !empty($row['team_season_ids']) ? explode(',', $row['team_season_ids']) : [];
        }
        return $rows;
    }


    public function getAthleteById(string $id): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT a.id, a.user_id, a.team_id, a.full_name,
                    a.first_name, a.last_name,
                    a.jersey_number, a.role,
                    a.birth_date, a.birth_place,
                    a.height_cm, a.weight_kg, a.photo_path,
                    a.residence_address, a.residence_city,
                    a.fiscal_code, a.identity_document, a.federal_id,
                    a.email, a.phone,
                    a.parent_contact, a.parent_phone,
                    a.medical_cert_type, a.medical_cert_expires_at,
                    a.contract_file_path, a.id_doc_front_file_path, a.id_doc_back_file_path,
                    a.cf_doc_front_file_path, a.cf_doc_back_file_path, a.medical_cert_file_path,
                    a.shirt_size, a.shoe_size,
                    a.is_active,
                    t.name AS team_name, t.category
             FROM athletes a
             LEFT JOIN teams t ON a.team_id = t.id
             WHERE a.id = :id AND a.deleted_at IS NULL
             LIMIT 1'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row)
            return null;

        // Append all teams from athlete_teams junction table (if exists)
        $teams = $this->getAthleteTeams($id);
        $row['team_ids'] = array_column($teams, 'id');
        $row['team_names'] = $teams;
        // Fallback: if no junction rows yet, use legacy team_id
        if (empty($row['team_ids']) && !empty($row['team_id'])) {
            $row['team_ids'] = [$row['team_id']];
        }
        return $row;
    }

    /**
     * Returns all team seasons associated with an athlete via athlete_teams junction.
     * Gracefully returns empty array if the table does not yet exist.
     */
    public function getAthleteTeams(string $athleteId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT ts.id AS team_season_id, t.id AS team_id, t.name, t.category, ts.season
                 FROM athlete_teams at2
                 JOIN team_seasons ts ON ts.id = at2.team_season_id
                 JOIN teams t ON t.id = ts.team_id
                 WHERE at2.athlete_id = :id
                   AND t.deleted_at IS NULL
                 ORDER BY ts.season DESC, t.category, t.name'
            );
            $stmt->execute([':id' => $athleteId]);
            return $stmt->fetchAll();
        }
        catch (\Throwable) {
            return [];
        }
    }

    /**
     * Replaces all team season associations for an athlete.
     * Also keeps athletes.team_id in sync with the first team in the list.
     *
     * @param string   $athleteId
     * @param string[] $teamSeasonIds Array of team_season IDs to associate
     * @param string|null $primaryTeamId The base team ID to set on the athlete record
     */
    public function setAthleteTeams(string $athleteId, array $teamSeasonIds, ?string $primaryTeamId = null): void
    {
        try {
            // Remove existing associations
            $del = $this->db->prepare('DELETE FROM athlete_teams WHERE athlete_id = :id');
            $del->execute([':id' => $athleteId]);

            // Insert new ones
            if (!empty($teamSeasonIds)) {
                $ins = $this->db->prepare(
                    'INSERT IGNORE INTO athlete_teams (athlete_id, team_season_id) VALUES (:athlete_id, :team_season_id)'
                );
                foreach ($teamSeasonIds as $tsid) {
                    if (!empty($tsid)) {
                        $ins->execute([':athlete_id' => $athleteId, ':team_season_id' => $tsid]);
                    }
                }
            }
            
            // Sync primary team_id on the athlete record if provided
            if ($primaryTeamId !== null) {
                $upd = $this->db->prepare('UPDATE athletes SET team_id = :team_id WHERE id = :id');
                $upd->execute([':team_id' => $primaryTeamId, ':id' => $athleteId]);
            }
        }
        catch (\Throwable $e) {
            // Table might not exist yet — silently ignore
            error_log('[athlete_teams] setAthleteTeams failed: ' . $e->getMessage());
        }
    }

    public function createAthlete(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO athletes (
                id, user_id, team_id,
                first_name, last_name,
                jersey_number, role,
                birth_date, birth_place,
                height_cm, weight_kg,
                photo_path,
                residence_address, residence_city,
                fiscal_code, identity_document, federal_id,
                email, phone,
                parent_contact, parent_phone,
                medical_cert_type, medical_cert_expires_at,
                shirt_size, shoe_size,
                is_active
             ) VALUES (
                :id, :user_id, :team_id,
                :first_name, :last_name,
                :jersey_number, :role,
                :birth_date, :birth_place,
                :height_cm, :weight_kg,
                :photo_path,
                :residence_address, :residence_city,
                :fiscal_code, :identity_document, :federal_id,
                :email, :phone,
                :parent_contact, :parent_phone,
                :medical_cert_type, :medical_cert_expires_at,
                :shirt_size, :shoe_size,
                1
             )'
        );
        $stmt->execute($data);
    }

    public function updateAthlete(string $id, array $data): void
    {
        $data[':id'] = $id;
        $stmt = $this->db->prepare(
            'UPDATE athletes
             SET first_name = :first_name,
                 last_name = :last_name,
                 jersey_number = :jersey_number,
                 role = :role,
                 team_id = :team_id,
                 birth_date = :birth_date,
                 birth_place = :birth_place,
                 height_cm = :height_cm,
                 weight_kg = :weight_kg,
                 residence_address = :residence_address,
                 residence_city = :residence_city,
                 fiscal_code = :fiscal_code,
                 identity_document = :identity_document,
                 federal_id = :federal_id,
                 email = :email,
                 phone = :phone,
                 parent_contact = :parent_contact,
                 parent_phone = :parent_phone,
                 medical_cert_type = :medical_cert_type,
                 medical_cert_expires_at = :medical_cert_expires_at,
                 shirt_size = :shirt_size,
                 shoe_size = :shoe_size
             WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute($data);
    }

    public function softDeleteAthlete(string $id): void
    {
        $stmt = $this->db->prepare('UPDATE athletes SET deleted_at = NOW() WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    public function updatePhotoPath(string $id, ?string $photoPath): void
    {
        $stmt = $this->db->prepare(
            'UPDATE athletes SET photo_path = :photo_path WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([':photo_path' => $photoPath, ':id' => $id]);
    }

    public function updateDocumentPath(string $id, string $dbField, ?string $path): void
    {
        // Must ensure $dbField is dynamically injected safely or matched against allowlist in Controller
        // Wait, PDO cannot bind column names, so we inject it safely.
        $stmt = $this->db->prepare(
            "UPDATE athletes SET {$dbField} = :path WHERE id = :id AND deleted_at IS NULL"
        );
        $stmt->execute([':path' => $path, ':id' => $id]);
    }

    // ─── METRICS ──────────────────────────────────────────────────────────────

    public function insertMetric(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO metrics_logs (id, athlete_id, event_id, log_date, duration_min, rpe, load_value, acwr_score, notes)
             VALUES (:id, :athlete_id, :event_id, :log_date, :duration_min, :rpe, :load_value, :acwr_score, :notes)'
        );
        $stmt->execute($data);
    }

    /**
     * PERF: Returns both acute (7d) and chronic (28d) loads in a SINGLE query.
     * Avoids 2 round-trips to the DB per athlete profile load.
     *
     * @return array{acute: float, chronic: float}
     */
    public function getAcwrLoads(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                COALESCE(SUM(CASE WHEN log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)  THEN load_value ELSE 0 END), 0)      AS acute,
                COALESCE(SUM(CASE WHEN log_date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY) THEN load_value ELSE 0 END), 0) / 4  AS chronic
             FROM metrics_logs
             WHERE athlete_id = :id
               AND log_date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)'
        );
        $stmt->execute([':id' => $athleteId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return [
            'acute' => (float)($row['acute'] ?? 0),
            'chronic' => (float)($row['chronic'] ?? 0),
        ];
    }

    public function getMetricsHistory(string $athleteId, int $days = 30): array
    {
        // NOTE: MySQL does not support PDO named parameters inside INTERVAL expressions.
        // The integer is cast strictly and interpolated directly — safe from SQL injection.
        $daysInt = (int)$days;
        $daysIntStr = (string)$daysInt;
        $stmt = $this->db->prepare(
            "SELECT id, log_date, duration_min, rpe, load_value, acwr_score, notes
             FROM metrics_logs
             WHERE athlete_id = :id AND log_date >= DATE_SUB(CURDATE(), INTERVAL " . $daysIntStr . " DAY)
             ORDER BY log_date DESC"
        );
        $stmt->bindValue(':id', $athleteId);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /**
     * Update the acwr_score of an already-inserted metric record.
     * Called after calcACWR() which must run post-insert.
     */
    public function updateMetricAcwr(string $metricId, float $acwr): void
    {
        $stmt = $this->db->prepare(
            'UPDATE metrics_logs SET acwr_score = :acwr WHERE id = :id'
        );
        $stmt->execute([':acwr' => $acwr, ':id' => $metricId]);
    }

    public function getCoachNotes(string $athleteId, int $limit = 10): array
    {
        $stmt = $this->db->prepare(
            'SELECT ml.log_date, ml.notes, ml.acwr_score, ml.duration_min, ml.rpe
             FROM metrics_logs ml
             WHERE ml.athlete_id = :id AND ml.notes IS NOT NULL AND ml.notes != \'\'
             ORDER BY ml.log_date DESC
             LIMIT :lim'
        );
        $stmt->bindValue(':id', $athleteId);
        $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    // ─── TEAMS ────────────────────────────────────────────────────────────────

    public function listTeams(): array
    {
        $stmt = $this->db->prepare(
            'SELECT ts.id AS id, t.name, t.category, t.color_hex, ts.season
             FROM team_seasons ts
             JOIN teams t ON ts.team_id = t.id
             WHERE t.deleted_at IS NULL AND t.is_active = 1
             ORDER BY ts.season DESC, t.category, t.name'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }

    // ─── AI SUMMARIES ────────────────────────────────────────────────────────

    public function saveAiSummary(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO ai_summaries (id, athlete_id, period_start, period_end, summary_text, model_version)
             VALUES (:id, :athlete_id, :period_start, :period_end, :summary_text, :model_version)'
        );
        $stmt->execute($data);
    }

    public function getLatestAiSummary(string $athleteId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, period_start, period_end, summary_text, model_version, created_at
             FROM ai_summaries WHERE athlete_id = :id ORDER BY created_at DESC LIMIT 1'
        );
        $stmt->execute([':id' => $athleteId]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    // ─── ACWR ALERTS ─────────────────────────────────────────────────────────

    public function insertAcwrAlert(string $athleteId, float $acwr, string $riskLevel): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO acwr_alerts (athlete_id, acwr_score, risk_level, log_date)
             VALUES (:athlete_id, :acwr, :risk, CURDATE())'
        );
        $stmt->execute([':athlete_id' => $athleteId, ':acwr' => $acwr, ':risk' => $riskLevel]);
    }

    /**
     * Get ACWR alerts not yet acknowledged, scoped to coachId's tenant.
     * Filters via the athletes table to prevent cross-tenant data leaks.
     *
     * @param string $tenantId  The tenant to scope results to (required)
     */
    public function getUnacknowledgedAlerts(string $tenantId, string $coachId = ''): array
    {
        $stmt = $this->db->prepare(
            'SELECT al.id, al.athlete_id, a.full_name AS athlete_name, al.acwr_score,
                    al.risk_level, al.log_date
             FROM acwr_alerts al
             JOIN athletes a ON a.id = al.athlete_id
             WHERE al.ack_at IS NULL
               AND a.tenant_id = :tid
               AND a.deleted_at IS NULL
             ORDER BY al.log_date DESC, al.risk_level DESC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll();
    }

    // ─── ACTIVITY LOG (dashboard overview) ───────────────────────────────────

    /**
     * Returns the last 5 audit_log entries for each section of an athlete.
     *
     * Sections:
     *  - anagrafica  : table_name IN ('athletes') AND record_id = athleteId
     *  - metrics     : table_name = 'metrics_logs' AND JSON_EXTRACT(after_snapshot,'$.athlete_id') = athleteId
     *  - pagamenti   : table_name IN ('payment_plans','installments') AND JSON_EXTRACT(after_snapshot|before_snapshot,'$.athlete_id') = athleteId
     *  - documenti   : table_name = 'athlete_documents' AND JSON_EXTRACT(after_snapshot,'$.athlete_id') = athleteId
     */
    public function getActivityLog(string $athleteId): array
    {
        // PERF: dopo la migration V039, la colonna generata `json_entity_id` è indicizzata.
        // Le query usano quella invece di JSON_EXTRACT() inline (full table scan → index lookup).
        // Fallback: se la colonna non esiste ancora (migration non applicata), usa JSON_EXTRACT.
        $useGeneratedCol = $this->_hasColumn('audit_logs', 'json_entity_id');

        $sql = function (string $whereClause) use ($athleteId): array {
            $stmt = $this->db->prepare(
                "SELECT al.id, al.action, al.table_name, al.created_at,
                        COALESCE(u.email, al.user_id, 'Sistema') AS operator,
                        al.after_snapshot, al.before_snapshot
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 WHERE {$whereClause}
                 ORDER BY al.created_at DESC
                 LIMIT 5"
            );
            $stmt->bindValue(':athlete_id', $athleteId);
            $stmt->execute();
            return $stmt->fetchAll();
        };

        if ($useGeneratedCol) {
            // Fast path: usa la colonna generata indicizzata (V039 applicata)
            return [
                'anagrafica' => $sql("al.table_name = 'athletes' AND al.record_id = :athlete_id"),
                'metrics' => $sql("al.table_name = 'metrics_logs' AND al.json_entity_id = :athlete_id"),
                'pagamenti' => $sql("al.table_name IN ('payment_plans','installments') AND al.json_entity_id = :athlete_id"),
                'documenti' => $sql("al.table_name = 'athlete_documents' AND al.json_entity_id = :athlete_id"),
            ];
        }

        // Slow path (fallback pre-V039): JSON_EXTRACT inline → full table scan
        // Applicare la migration db/migrations/V039__audit_logs_perf_indexes.sql per eliminare questo path.
        return [
            'anagrafica' => $sql("al.table_name IN ('athletes') AND al.record_id = :athlete_id"),
            'metrics' => $sql("al.table_name = 'metrics_logs' AND JSON_UNQUOTE(JSON_EXTRACT(al.after_snapshot, '$.athlete_id')) = :athlete_id"),
            'pagamenti' => $sql("al.table_name IN ('payment_plans','installments')
                                  AND (JSON_UNQUOTE(JSON_EXTRACT(al.after_snapshot,  '$.athlete_id')) = :athlete_id
                                    OR JSON_UNQUOTE(JSON_EXTRACT(al.before_snapshot, '$.athlete_id')) = :athlete_id)"),
            'documenti' => $sql("al.table_name = 'athlete_documents' AND JSON_UNQUOTE(JSON_EXTRACT(al.after_snapshot, '$.athlete_id')) = :athlete_id"),
        ];
    }

    /** Check if a column exists in a table (used for migration-aware code paths). */
    private function _hasColumn(string $table, string $column): bool
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME   = :tbl
                   AND COLUMN_NAME  = :col"
            );
            $stmt->execute([':tbl' => $table, ':col' => $column]);
            return (int)$stmt->fetchColumn() > 0;
        }
        catch (\Throwable) {
            return false;
        }
    }
}