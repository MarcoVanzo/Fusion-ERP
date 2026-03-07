<?php
/**
 * Biometrics Repository — DB Queries for Biometrics & Athletic Metrics
 * Fusion ERP v1.0 — Module B
 */

declare(strict_types=1);

namespace FusionERP\Modules\Biometrics;

use FusionERP\Shared\Database;

class BiometricsRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── BIOMETRIC RECORDS ───────────────────────────────────────────────────

    /**
     * Insert a new biometric record. BMI is auto-calculated.
     * @param array $data Keyed array with prefixed PDO params
     */
    public function insertBiometric(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO biometric_records (id, tenant_id, athlete_id, record_date, height_cm, weight_kg, bmi, wingspan_cm, measured_by, notes)
             VALUES (:id, :tenant_id, :athlete_id, :record_date, :height_cm, :weight_kg, :bmi, :wingspan_cm, :measured_by, :notes)'
        );
        $stmt->execute($data);
    }

    /**
     * Get biometric history for an athlete, ordered by date desc.
     * @param string $athleteId
     * @param int $limit
     * @return array
     */
    public function getBiometrics(string $athleteId, int $limit = 50): array
    {
        $stmt = $this->db->prepare(
            'SELECT id, record_date, height_cm, weight_kg, bmi, wingspan_cm, measured_by, notes, created_at
             FROM biometric_records
             WHERE athlete_id = :athlete_id
             ORDER BY record_date DESC
             LIMIT :lim'
        );
        $stmt->bindValue(':athlete_id', $athleteId);
        $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Get the latest biometric record for an athlete.
     */
    public function getLatestBiometric(string $athleteId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT id, record_date, height_cm, weight_kg, bmi, wingspan_cm
             FROM biometric_records
             WHERE athlete_id = :athlete_id
             ORDER BY record_date DESC
             LIMIT 1'
        );
        $stmt->execute([':athlete_id' => $athleteId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Get category average BMI for benchmarking.
     * @param string $category Team category (e.g. U13, U14)
     * @return float|null
     */
    public function getCategoryAvgBmi(string $category): ?float
    {
        $stmt = $this->db->prepare(
            'SELECT AVG(br.bmi)
             FROM biometric_records br
             JOIN athletes a ON a.id = br.athlete_id
             JOIN teams t ON t.id = a.team_id
             WHERE t.category = :category
               AND br.record_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
               AND br.bmi IS NOT NULL'
        );
        $stmt->execute([':category' => $category]);
        $val = $stmt->fetchColumn();
        return $val !== false ? round((float)$val, 1) : null;
    }

    // ─── ATHLETIC METRICS ────────────────────────────────────────────────────

    /**
     * Insert a new athletic metric record.
     */
    public function insertMetric(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO athletic_metrics (id, tenant_id, athlete_id, record_date, metric_type, value, unit, measured_by, notes)
             VALUES (:id, :tenant_id, :athlete_id, :record_date, :metric_type, :value, :unit, :measured_by, :notes)'
        );
        $stmt->execute($data);
    }

    /**
     * Get athletic metrics history, optionally filtered by type.
     * @param string $athleteId
     * @param string|null $metricType
     * @param int $limit
     * @return array
     */
    public function getMetrics(string $athleteId, ?string $metricType = null, int $limit = 50): array
    {
        $sql = 'SELECT id, record_date, metric_type, value, unit, measured_by, notes, created_at
                FROM athletic_metrics
                WHERE athlete_id = :athlete_id';
        $params = [':athlete_id' => $athleteId];

        if ($metricType !== null) {
            $sql .= ' AND metric_type = :metric_type';
            $params[':metric_type'] = $metricType;
        }
        $sql .= ' ORDER BY record_date DESC LIMIT ' . (int)$limit;

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Get the latest value for each metric type for a given athlete.
     * Returns array keyed by metric_type.
     */
    public function getLatestMetrics(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT am.metric_type, am.value, am.unit, am.record_date
             FROM athletic_metrics am
             INNER JOIN (
                 SELECT metric_type, MAX(record_date) AS max_date
                 FROM athletic_metrics
                 WHERE athlete_id = :athlete_id
                 GROUP BY metric_type
             ) latest ON am.metric_type = latest.metric_type AND am.record_date = latest.max_date
             WHERE am.athlete_id = :athlete_id2'
        );
        $stmt->execute([':athlete_id' => $athleteId, ':athlete_id2' => $athleteId]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        $result = [];
        foreach ($rows as $row) {
            $result[$row['metric_type']] = $row;
        }
        return $result;
    }

    /**
     * Calculate trend for a specific metric type: 'improving', 'declining', or 'stable'.
     * Compares last 3 values.
     *
     * @param string $athleteId
     * @param string $metricType
     * @return string 'improving'|'declining'|'stable'|'insufficient_data'
     */
    public function getMetricTrend(string $athleteId, string $metricType): string
    {
        $stmt = $this->db->prepare(
            'SELECT value FROM athletic_metrics
             WHERE athlete_id = :athlete_id AND metric_type = :metric_type
             ORDER BY record_date DESC
             LIMIT 3'
        );
        $stmt->execute([':athlete_id' => $athleteId, ':metric_type' => $metricType]);
        $values = $stmt->fetchAll(\PDO::FETCH_COLUMN);

        if (count($values) < 3) {
            return 'insufficient_data';
        }

        // Values are in desc order: [newest, middle, oldest]
        // For metrics where higher is better (jump, VO2max): newest > oldest = improving
        // For metrics where lower is better (sprint times): newest < oldest = improving
        $lowerIsBetter = in_array($metricType, [
            'SPRINT_10M', 'SPRINT_20M', 'SPRINT_40M', 'REST_HEART_RATE'
        ], true);

        $newest = (float)$values[0];
        $oldest = (float)$values[2];
        $diff = $newest - $oldest;
        $threshold = abs($oldest) * 0.02; // 2% tolerance for "stable"

        if (abs($diff) <= $threshold) {
            return 'stable';
        }

        if ($lowerIsBetter) {
            return $diff < 0 ? 'improving' : 'declining';
        }
        return $diff > 0 ? 'improving' : 'declining';
    }

    /**
     * Get metrics summary: latest values + trend for each metric type.
     */
    public function getMetricsSummary(string $athleteId): array
    {
        $latest = $this->getLatestMetrics($athleteId);
        $summary = [];

        foreach ($latest as $type => $data) {
            $trend = $this->getMetricTrend($athleteId, $type);
            $summary[] = [
                'metric_type' => $type,
                'value' => $data['value'],
                'unit' => $data['unit'],
                'record_date' => $data['record_date'],
                'trend' => $trend,
            ];
        }

        return $summary;
    }
}