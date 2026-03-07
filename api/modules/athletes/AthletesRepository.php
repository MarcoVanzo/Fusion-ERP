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

    public function listAthletes(string $teamId = '', bool $includeInactive = false): array
    {
        $sql = 'SELECT a.id, a.team_id, a.full_name, a.jersey_number, a.role, a.birth_date,
                       a.height_cm, a.weight_kg, a.photo_path, a.is_active,
                       a.phone, a.email, a.fiscal_code, a.medical_cert_expires_at,
                       a.residence_address, a.residence_city, a.parent_contact, a.parent_phone,
                       COALESCE(t.name, a.team_id, "Nessuna squadra") AS team_name,
                       COALESCE(t.category, a.team_id, "Nessuna") AS category
                FROM athletes a
                LEFT JOIN teams t ON a.team_id = t.id
                WHERE a.deleted_at IS NULL';

        $params = [];
        if ($teamId !== '') {
            $sql .= ' AND a.team_id = :team_id';
            $params[':team_id'] = $teamId;
        }
        if (!$includeInactive) {
            $sql .= ' AND a.is_active = 1';
        }
        $sql .= ' ORDER BY a.full_name';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
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
        return $row ?: null;
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
     * Returns the sum of load_value for the last 7 days.
     */
    public function getAcuteLoad(string $athleteId): float
    {
        $stmt = $this->db->prepare(
            'SELECT COALESCE(SUM(load_value), 0)
             FROM metrics_logs
             WHERE athlete_id = :id AND log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
        );
        $stmt->execute([':id' => $athleteId]);
        return (float)$stmt->fetchColumn();
    }

    /**
     * Returns the average weekly load over 4 weeks (28 days).
     */
    public function getChronicLoad(string $athleteId): float
    {
        $stmt = $this->db->prepare(
            'SELECT COALESCE(SUM(load_value), 0) / 4
             FROM metrics_logs
             WHERE athlete_id = :id AND log_date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)'
        );
        $stmt->execute([':id' => $athleteId]);
        return (float)$stmt->fetchColumn();
    }

    public function getMetricsHistory(string $athleteId, int $days = 30): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, log_date, duration_min, rpe, load_value, acwr_score, notes
             FROM metrics_logs
             WHERE athlete_id = :id AND log_date >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
             ORDER BY log_date DESC'
        );
        $stmt->bindValue(':id', $athleteId);
        $stmt->bindValue(':days', $days, \PDO::PARAM_INT);
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
            'SELECT id, name, category, season, color_hex FROM teams WHERE deleted_at IS NULL AND is_active = 1 ORDER BY category, name'
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
}