<?php
/**
 * Biometrics Controller — Biometric Records & Athletic Metrics
 * Fusion ERP v1.0 — Module B
 *
 * Endpoints:
 *   POST ?module=biometrics&action=addBiometric     — add biometric measurement
 *   GET  ?module=biometrics&action=getBiometrics     — biometric history
 *   POST ?module=biometrics&action=addMetric         — add athletic metric
 *   GET  ?module=biometrics&action=getMetrics        — metric history (filterable)
 *   GET  ?module=biometrics&action=getMetricsSummary — latest + trends
 *   GET  ?module=biometrics&action=getGroupMetrics   — all athletes latest metrics + group averages
 */

declare(strict_types=1);

namespace FusionERP\Modules\Biometrics;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class BiometricsController
{
    private BiometricsRepository $repo;

    /** Valid metric type enum values */
    private const METRIC_TYPES = [
        'SPRINT_10M', 'SPRINT_20M', 'SPRINT_40M',
        'VERTICAL_JUMP_CMJ', 'VERTICAL_JUMP_SJ', 'BROAD_JUMP',
        'BEEP_TEST', 'VO2MAX',
        'REST_HEART_RATE', 'MAX_HEART_RATE',
        'RPE', 'HRV', 'TRAINING_LOAD',
        'STRENGTH_1RM',
    ];

    public function __construct()
    {
        $this->repo = new BiometricsRepository();
    }

    // ─── POST ?module=biometrics&action=addBiometric ─────────────────────────

    /**
     * Add a new biometric measurement for an athlete.
     * Auto-calculates BMI from height and weight.
     */
    public function addBiometric(): void
    {
        Auth::requireWrite('biometrics');
        $user = Auth::user();
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id', 'record_date']);

        // At least one measurement must be present
        if (empty($body['height_cm']) && empty($body['weight_kg']) && empty($body['wingspan_cm'])) {
            Response::error('Almeno un valore biometrico è obbligatorio (altezza, peso o apertura alare)', 400);
        }

        $heightCm = isset($body['height_cm']) ? (int)$body['height_cm'] : null;
        $weightKg = isset($body['weight_kg']) ? (float)$body['weight_kg'] : null;

        // Auto-calculate BMI if both height and weight are provided
        $bmi = null;
        if ($heightCm !== null && $heightCm > 0 && $weightKg !== null && $weightKg > 0) {
            $heightM = $heightCm / 100;
            $bmi = round($weightKg / ($heightM * $heightM), 1);
        }

        $id = 'BIO_' . bin2hex(random_bytes(4));
        $tenantId = TenantContext::id();

        $this->repo->insertBiometric([
            ':id' => $id,
            ':tenant_id' => $tenantId,
            ':athlete_id' => $body['athlete_id'],
            ':record_date' => $body['record_date'],
            ':height_cm' => $heightCm,
            ':weight_kg' => $weightKg,
            ':bmi' => $bmi,
            ':wingspan_cm' => isset($body['wingspan_cm']) ? (int)$body['wingspan_cm'] : null,
            ':measured_by' => $user['id'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ]);

        // Also update the athlete's current height/weight on the main record
        $this->updateAthleteCurrentBiometrics($body['athlete_id'], $heightCm, $weightKg);

        Audit::log('INSERT', 'biometric_records', $id, null, $body);
        Response::success(['id' => $id, 'bmi' => $bmi], 201);
    }

    // ─── GET ?module=biometrics&action=getBiometrics&id=ATH_xxx ──────────────

    /**
     * Get biometric history for an athlete.
     */
    public function getBiometrics(): void
    {
        Auth::requireRead('biometrics');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $records = $this->repo->getBiometrics($athleteId);
        $latest = $this->repo->getLatestBiometric($athleteId);

        Response::success([
            'records' => $records,
            'latest' => $latest,
        ]);
    }

    // ─── POST ?module=biometrics&action=addMetric ────────────────────────────

    /**
     * Add a new athletic performance metric for an athlete.
     */
    public function addMetric(): void
    {
        Auth::requireWrite('biometrics');
        $user = Auth::user();
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id', 'record_date', 'metric_type', 'value', 'unit']);

        // Validate metric type
        $metricType = strtoupper(trim($body['metric_type']));
        if (!in_array($metricType, self::METRIC_TYPES, true)) {
            Response::error("Tipo metrica non valido: {$metricType}. Valori accettati: " . implode(', ', self::METRIC_TYPES), 400);
        }

        $id = 'AM_' . bin2hex(random_bytes(4));
        $tenantId = TenantContext::id();

        $this->repo->insertMetric([
            ':id' => $id,
            ':tenant_id' => $tenantId,
            ':athlete_id' => $body['athlete_id'],
            ':record_date' => $body['record_date'],
            ':metric_type' => $metricType,
            ':value' => (float)$body['value'],
            ':unit' => $body['unit'],
            ':measured_by' => $user['id'] ?? null,
            ':notes' => $body['notes'] ?? null,
        ]);

        Audit::log('INSERT', 'athletic_metrics', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    // ─── GET ?module=biometrics&action=getMetrics&id=ATH_xxx ─────────────────

    /**
     * Get athletic metrics history, optionally filtered by metric_type.
     */
    public function getMetrics(): void
    {
        Auth::requireRead('biometrics');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        $type = filter_input(INPUT_GET, 'type', FILTER_DEFAULT);

        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $records = $this->repo->getMetrics($athleteId, $type ?: null);
        Response::success($records);
    }

    // ─── GET ?module=biometrics&action=getMetricsSummary&id=ATH_xxx ──────────

    /**
     * Get summary of latest metric values with trend indicators.
     */
    public function getMetricsSummary(): void
    {
        Auth::requireRead('biometrics');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $summary = $this->repo->getMetricsSummary($athleteId);
        Response::success($summary);
    }

    // ─── GET ?module=biometrics&action=getGroupMetrics ───────────────────────

    /**
     * Get latest metric values for all athletes in the tenant (or filtered by team).
     * Returns per-athlete metrics and group averages per metric type.
     *
     * Query params:
     *   team_id (optional) — filter by team
     */
    public function getGroupMetrics(): void
    {
        Auth::requireRead('biometrics');
        $tenantId = TenantContext::id();
        $teamId = filter_input(INPUT_GET, 'team_id', FILTER_DEFAULT) ?: null;

        $data = $this->repo->getGroupMetrics($tenantId, $teamId);
        Response::success($data);
    }

    // ─── GET ?module=biometrics&action=metricTypes ───────────────────────────

    /**
     * Return the list of valid metric types (for frontend selects).
     */
    public function metricTypes(): void
    {
        Auth::requireRead('biometrics');
        Response::success(self::METRIC_TYPES);
    }

    // ─── PRIVATE: Update athlete's current height/weight ────────────────────

    /**
     * Updates the athlete's snapshot height_cm and weight_kg on the main table
     * so the hero profile always shows the latest values.
     */
    private function updateAthleteCurrentBiometrics(string $athleteId, ?int $heightCm, ?float $weightKg): void
    {
        $sets = [];
        $params = [':id' => $athleteId];

        if ($heightCm !== null) {
            $sets[] = 'height_cm = :height_cm';
            $params[':height_cm'] = $heightCm;
        }
        if ($weightKg !== null) {
            $sets[] = 'weight_kg = :weight_kg';
            $params[':weight_kg'] = $weightKg;
        }

        if (empty($sets))
            return;

        $sql = 'UPDATE athletes SET ' . implode(', ', $sets) . ' WHERE id = :id AND deleted_at IS NULL';
        $stmt = \FusionERP\Shared\Database::getInstance()->prepare($sql);
        $stmt->execute($params);
    }
}