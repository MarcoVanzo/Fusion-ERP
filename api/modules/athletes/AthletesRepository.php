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
        $sql = 'SELECT a.id, a.full_name, a.jersey_number, a.role, a.birth_date,
                       a.height_cm, a.weight_kg, a.photo_path, a.is_active,
                       COALESCE(t.name, "Nessuna squadra") AS team_name, COALESCE(t.category, "Nessuna") AS category
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
            'SELECT a.id, a.user_id, a.team_id, a.full_name, a.jersey_number, a.role,
                    a.birth_date, a.height_cm, a.weight_kg, a.photo_path,
                    a.parent_contact, a.parent_phone, a.is_active,
                    t.name AS team_name, t.category
             FROM athletes a
             JOIN teams t ON a.team_id = t.id
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
            'INSERT INTO athletes (id, user_id, team_id, full_name, jersey_number, role,
                                   birth_date, height_cm, weight_kg, photo_path, parent_contact, parent_phone)
             VALUES (:id, :user_id, :team_id, :full_name, :jersey_number, :role,
                     :birth_date, :height_cm, :weight_kg, :photo_path, :parent_contact, :parent_phone)'
        );
        $stmt->execute($data);
    }

    public function updateAthlete(string $id, array $data): void
    {
        $data[':id'] = $id;
        $stmt = $this->db->prepare(
            'UPDATE athletes
             SET full_name = :full_name, jersey_number = :jersey_number, role = :role,
                 birth_date = :birth_date, height_cm = :height_cm, weight_kg = :weight_kg,
                 parent_contact = :parent_contact, parent_phone = :parent_phone, team_id = :team_id
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
             WHERE athlete_id = :id AND log_date >= DATE_SUB(CURDATE(), INTERVAL ' . (int)$days . ' DAY)
             ORDER BY log_date DESC'
        );
        $stmt->execute([':id' => $athleteId]);
        return $stmt->fetchAll();
    }

    public function getCoachNotes(string $athleteId, int $limit = 10): array
    {
        $stmt = $this->db->prepare(
            'SELECT m.log_date, m.notes, m.acwr_score, ml.duration_min, ml.rpe
             FROM metrics_logs ml
             JOIN metrics_logs m ON m.id = ml.id
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

    public function getUnacknowledgedAlerts(string $coachId = ''): array
    {
        $stmt = $this->db->prepare(
            'SELECT al.id, al.athlete_id, a.full_name AS athlete_name, al.acwr_score,
                    al.risk_level, al.log_date
             FROM acwr_alerts al
             JOIN athletes a ON a.id = al.athlete_id
             WHERE al.ack_at IS NULL
             ORDER BY al.log_date DESC, al.risk_level DESC'
        );
        $stmt->execute();
        return $stmt->fetchAll();
    }
}