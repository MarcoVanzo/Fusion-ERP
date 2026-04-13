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
     * Get the latest metric value for every metric type for each athlete in the tenant.
     * Optionally filter by team_id. Returns per-athlete rows and group averages.
     *
     * @param string $tenantId
     * @param string|null $teamId  Filter by specific team
     * @return array ['athletes' => [...], 'averages' => [...], 'metric_types' => [...]]
     */
    public function getGroupMetrics(string $tenantId, ?string $teamId = null): array
    {
        // 1) Get all athletes (with team info)
        $whereSql = 'a.tenant_id = :tenant_id AND a.deleted_at IS NULL';
        $params = [':tenant_id' => $tenantId];
        if ($teamId !== null) {
            $whereSql .= ' AND a.team_id = :team_id';
            $params[':team_id'] = $teamId;
        }

        $athleteStmt = $this->db->prepare(
            "SELECT a.id, a.first_name, a.last_name,
                    CONCAT(a.first_name, ' ', a.last_name) AS full_name,
                    a.jersey_number, a.role, a.height_cm, a.weight_kg,
                    t.id AS team_id, t.name AS team_name, t.category
             FROM athletes a
             LEFT JOIN teams t ON t.id = a.team_id
             WHERE {$whereSql}
             ORDER BY t.name, a.last_name, a.first_name"
        );
        $athleteStmt->execute($params);
        $athletes = $athleteStmt->fetchAll(\PDO::FETCH_ASSOC);

        if (empty($athletes)) {
            return ['athletes' => [], 'averages' => [], 'metric_types' => []];
        }

        $athleteIds = array_column($athletes, 'id');
        $inList = implode(',', array_fill(0, count($athleteIds), '?'));

        // 2) Get latest VALD test per athlete
        $metricStmt = $this->db->prepare(
            "SELECT v.athlete_id, v.metrics, v.test_type
             FROM vald_test_results v
             INNER JOIN (
                 SELECT athlete_id, MAX(test_date) as max_date
                 FROM vald_test_results
                 WHERE athlete_id IN ($inList)
                 GROUP BY athlete_id
             ) latest ON v.athlete_id = latest.athlete_id AND v.test_date = latest.max_date
             WHERE v.athlete_id IN ($inList)"
        );
        $metricStmt->execute(array_merge($athleteIds, $athleteIds));
        $valdResults = $metricStmt->fetchAll(\PDO::FETCH_ASSOC);

        $resultsByAthlete = [];
        foreach ($valdResults as $r) {
            $resultsByAthlete[$r['athlete_id']] = $r;
        }

        $allMetricTypes = [
            'CMJ_JUMP_HEIGHT' => 'cm',
            'CMJ_RSIMOD'      => '',
            'CMJ_BRAKING'     => 'Ns',
            'CMJ_ASYMMETRY'   => '%'
        ];

        // 4) Build athlete rows
        $athleteRows = [];
        $sums = [];
        $counts = [];

        foreach ($athletes as $a) {
            $metricsMap = [];
            $vData = $resultsByAthlete[$a['id']] ?? null;

            if ($vData) {
                $metricsJson = json_decode($vData['metrics'], true) ?: [];

                // JumpHeight — use the key actually saved by ValdController
                $jh = $metricsJson['JumpHeight']['Value'] ?? null;

                $rsi = $metricsJson['RSIModified']['Value'] ?? null;

                // BrakingImpulse — exact key saved by ValdController
                $braking = $metricsJson['BrakingImpulse']['Value'] ?? null;

                // Asymmetry: computed from left/right landing peak force stored in metrics JSON
                // ValdController saves these as LandingForceLeft / LandingForceRight
                $forceL = $metricsJson['LandingForceLeft']['Value']
                       ?? $metricsJson['PeakForceLeft']['Value']
                       ?? 0;
                $forceR = $metricsJson['LandingForceRight']['Value']
                       ?? $metricsJson['PeakForceRight']['Value']
                       ?? 0;

                $asymPct = null;
                if ($forceL + $forceR > 0) {
                    $max = max($forceL, $forceR);
                    $min = min($forceL, $forceR);
                    $asymPct = round((($max - $min) / $max) * 100, 1);
                }

                if ($jh !== null) {
                    $metricsMap['CMJ_JUMP_HEIGHT'] = [
                        'name' => 'Jump Height',
                        'value' => round($jh, 1),
                        'unit' => 'cm',
                        'icon' => 'arrow-fat-up',
                        'color' => '#00E676'
                    ];
                    $sums['CMJ_JUMP_HEIGHT'] = ($sums['CMJ_JUMP_HEIGHT'] ?? 0) + $jh;
                    $counts['CMJ_JUMP_HEIGHT'] = ($counts['CMJ_JUMP_HEIGHT'] ?? 0) + 1;
                }
                
                if ($rsi !== null) {
                    $color = ($rsi >= 0.45) ? '#00E676' : '#FFD600';
                    $metricsMap['CMJ_RSIMOD'] = [
                        'name' => 'RSImod',
                        'value' => round($rsi, 3),
                        'unit' => '',
                        'icon' => 'lightning',
                        'color' => $color
                    ];
                    $sums['CMJ_RSIMOD'] = ($sums['CMJ_RSIMOD'] ?? 0) + $rsi;
                    $counts['CMJ_RSIMOD'] = ($counts['CMJ_RSIMOD'] ?? 0) + 1;
                }

                if ($braking !== null) {
                    $metricsMap['CMJ_BRAKING'] = [
                        'name' => 'Braking Impulse',
                        'value' => round($braking, 0),
                        'unit' => 'Ns',
                        'icon' => 'arrows-in',
                        'color' => '#00E676'
                    ];
                    $sums['CMJ_BRAKING'] = ($sums['CMJ_BRAKING'] ?? 0) + $braking;
                    $counts['CMJ_BRAKING'] = ($counts['CMJ_BRAKING'] ?? 0) + 1;
                }

                if ($asymPct !== null) {
                    $color = '#00E676';
                    if ($asymPct > 10) $color = '#FFD600';
                    if ($asymPct > 15) $color = '#FF1744';
                    $metricsMap['CMJ_ASYMMETRY'] = [
                        'name' => 'Asimmetria',
                        'value' => round($asymPct, 1),
                        'unit' => '%',
                        'icon' => 'arrows-left-right',
                        'color' => $color
                    ];
                    $sums['CMJ_ASYMMETRY'] = ($sums['CMJ_ASYMMETRY'] ?? 0) + $asymPct;
                    $counts['CMJ_ASYMMETRY'] = ($counts['CMJ_ASYMMETRY'] ?? 0) + 1;
                }
            }

            $athleteRows[] = [
                'id' => $a['id'],
                'full_name' => $a['full_name'],
                'jersey_number' => $a['jersey_number'],
                'role' => $a['role'],
                'height_cm' => $a['height_cm'],
                'weight_kg' => $a['weight_kg'],
                'team_id' => $a['team_id'],
                'team_name' => $a['team_name'],
                'category' => $a['category'],
                'metrics' => $metricsMap,
            ];
        }

        $averages = [];
        foreach ($sums as $type => $sum) {
            $val = $sum / $counts[$type];
            $averages[$type] = [
                'value' => round($val, $type === 'CMJ_RSIMOD' ? 3 : 1),
                'unit' => $allMetricTypes[$type],
                'count' => $counts[$type],
            ];
        }

        return [
            'athletes' => $athleteRows,
            'averages' => $averages,
            'metric_types' => $allMetricTypes,
        ];
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