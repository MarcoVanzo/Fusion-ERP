<?php
/**
 * ValdRepository — DB implementation for VALD data
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Vald;

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

class ValdRepository
{
    private $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /**
     * Get test results for a specific athlete.
     */
    public function getResultsByAthlete(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM vald_test_results 
             WHERE tenant_id = :t1
               AND athlete_id IN (
                   SELECT id FROM athletes 
                   WHERE tenant_id = :t2 
                     AND (
                         (vald_profile_id IS NOT NULL AND vald_profile_id = (
                             SELECT vald_profile_id FROM athletes 
                             WHERE id = :athlete_id2 AND tenant_id = :t3 LIMIT 1
                         ))
                         OR id = :athlete_id3
                     )
               )
             ORDER BY test_date DESC'
        );
        $stmt->execute([
            ':athlete_id2' => $athleteId,
            ':athlete_id3' => $athleteId,
            ':t1' => TenantContext::id(),
            ':t2' => TenantContext::id(),
            ':t3' => TenantContext::id()
        ]);
        return $stmt->fetchAll();
    }

    /**
     * Get the latest test result for an athlete.
     */
    public function getLatestResult(string $athleteId): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM vald_test_results 
             WHERE tenant_id = :t1
               AND athlete_id IN (
                   SELECT id FROM athletes 
                   WHERE tenant_id = :t2 
                     AND (
                         (vald_profile_id IS NOT NULL AND vald_profile_id = (
                             SELECT vald_profile_id FROM athletes 
                             WHERE id = :athlete_id2 AND tenant_id = :t3 LIMIT 1
                         ))
                         OR id = :athlete_id3
                     )
               )
             ORDER BY test_date DESC LIMIT 1'
        );
        $stmt->execute([
            ':athlete_id2' => $athleteId,
            ':athlete_id3' => $athleteId,
            ':t1' => TenantContext::id(),
            ':t2' => TenantContext::id(),
            ':t3' => TenantContext::id()
        ]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Get baseline metrics (average of historical tests excluding the latest).
     * Returns avg RSImod and avg TimeToTakeoff from the last N tests.
     */
    public function getBaselineMetrics(string $athleteId, int $limit = 5): array
    {
        $stmt = $this->db->prepare(
            'SELECT metrics FROM vald_test_results 
             WHERE tenant_id = :t1
               AND athlete_id IN (
                   SELECT id FROM athletes 
                   WHERE tenant_id = :t2 
                     AND (
                         (vald_profile_id IS NOT NULL AND vald_profile_id = (
                             SELECT vald_profile_id FROM athletes 
                             WHERE id = :athlete_id2 AND tenant_id = :t3 LIMIT 1
                         ))
                         OR id = :athlete_id3
                     )
               )
             ORDER BY test_date DESC
             LIMIT :lim OFFSET 1'
        );
        $stmt->bindValue(':athlete_id2', $athleteId);
        $stmt->bindValue(':athlete_id3', $athleteId);
        $stmt->bindValue(':t1', TenantContext::id());
        $stmt->bindValue(':t2', TenantContext::id());
        $stmt->bindValue(':t3', TenantContext::id());
        $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        if (empty($rows)) {
            return ['rsimod_avg' => null, 'ttto_avg' => null, 'peak_force_avg' => null, 'count' => 0];
        }

        $rsiVals = [];
        $tttoVals = [];
        $peakForceVals = [];

        foreach ($rows as $row) {
            $m = json_decode($row['metrics'] ?? '{}', true) ?: [];
            if (isset($m['RSIModified']['Value']))
                $rsiVals[] = (float)$m['RSIModified']['Value'];
            if (isset($m['TimeToTakeoff']['Value']))
                $tttoVals[] = (float)$m['TimeToTakeoff']['Value'];
            if (isset($m['PeakForce']['Value']))
                $peakForceVals[] = (float)$m['PeakForce']['Value'];
        }

        return [
            'rsimod_avg' => !empty($rsiVals) ? array_sum($rsiVals) / count($rsiVals) : null,
            'ttto_avg' => !empty($tttoVals) ? array_sum($tttoVals) / count($tttoVals) : null,
            'peak_force_avg' => !empty($peakForceVals) ? array_sum($peakForceVals) / count($peakForceVals) : null,
            'count' => count($rows),
        ];
    }

    /**
     * Get team ranking by relative power (Peak Force / BW).
     */
    public function getTeamRanking(int $topN = 10): array
    {
        $tenantId = TenantContext::id();

        // Get latest test per athlete, join with athlete weight
        $sql = "
            SELECT vtr.athlete_id, a.full_name, a.weight_kg, vtr.metrics, vtr.test_date
            FROM vald_test_results vtr
            INNER JOIN (
                SELECT athlete_id, MAX(test_date) as max_date
                FROM vald_test_results
                WHERE tenant_id = :tenant_id1
                GROUP BY athlete_id
            ) latest ON vtr.athlete_id = latest.athlete_id AND vtr.test_date = latest.max_date
            INNER JOIN athletes a ON a.id = vtr.athlete_id
            WHERE vtr.tenant_id = :tenant_id2
            ORDER BY vtr.test_date DESC
            LIMIT :topn
        ";

        $stmt = $this->db->prepare($sql);
        $stmt->bindValue(':tenant_id1', $tenantId);
        $stmt->bindValue(':tenant_id2', $tenantId);
        $stmt->bindValue(':topn', $topN, \PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $ranking = [];

        foreach ($rows as $row) {
            $m = json_decode($row['metrics'] ?? '{}', true) ?: [];
            $peakForce = $m['PeakForce']['Value'] ?? 0;
            $weight = (float)($row['weight_kg'] ?? 70);
            $rsimod = $m['RSIModified']['Value'] ?? 0;

            // Approximate power in kW: PeakForce * velocity_proxy
            // Using jump height as proxy: P ≈ PeakForce * sqrt(2 * g * jumpHeight) / 1000
            $jumpHeight = ($m['JumpHeightTotal']['Value'] ?? $m['JumpHeight']['Value'] ?? 0) / 100; // cm → m
            $velocityProxy = $jumpHeight > 0 ? sqrt(2 * 9.81 * $jumpHeight) : 0;
            $power = ($peakForce * $velocityProxy) / 1000;

            $ranking[] = [
                'athlete_id' => $row['athlete_id'],
                'name' => $row['full_name'],
                'power_kw' => round($power, 1),
                'peak_force_bw' => $weight > 0 ? round($peakForce / ($weight * 9.81), 2) : 0,
                'rsimod' => round((float)$rsimod, 2),
            ];
        }

        // Sort by power descending
        usort($ranking, fn($a, $b) => $b['power_kw'] <=> $a['power_kw']);

        return array_slice($ranking, 0, $topN);
    }

    /**
     * Save a test result (upsert).
     */
    public function saveResult(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO vald_test_results (id, tenant_id, athlete_id, test_id, test_date, test_type, metrics)
             VALUES (:id, :tenant_id, :athlete_id, :test_id, :test_date, :test_type, :metrics)
             ON DUPLICATE KEY UPDATE 
                metrics = VALUES(metrics),
                test_date = VALUES(test_date),
                test_type = VALUES(test_type),
                tenant_id = VALUES(tenant_id),
                athlete_id = VALUES(athlete_id)'
        );
        $stmt->execute($data);
    }

    /**
     * Get the date of the most recent test for this tenant (for sync optimization).
     */
    public function getLatestTestDate(): ?string
    {
        $stmt = $this->db->prepare(
            'SELECT MAX(test_date) FROM vald_test_results WHERE tenant_id = :tenant_id'
        );
        $stmt->execute([':tenant_id' => TenantContext::id()]);
        return $stmt->fetchColumn() ?: null;
    }

    /**
     * Compute baseline Braking Impulse from the last $limit historical tests
     * (offset 1 to exclude the latest). Returns null if insufficient data.
     */
    public function getBaselineBrakingImpulse(string $athleteId, int $limit = 5): ?float
    {
        $stmt = $this->db->prepare(
            'SELECT metrics FROM vald_test_results
             WHERE tenant_id = :t1
               AND athlete_id IN (
                   SELECT id FROM athletes 
                   WHERE tenant_id = :t2 
                     AND (
                         (vald_profile_id IS NOT NULL AND vald_profile_id = (
                             SELECT vald_profile_id FROM athletes 
                             WHERE id = :athlete_id2 AND tenant_id = :t3 LIMIT 1
                         ))
                         OR id = :athlete_id3
                     )
               )
             ORDER BY test_date DESC
             LIMIT :lim OFFSET 1'
        );
        $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
        $stmt->bindValue(':t1', TenantContext::id());
        $stmt->bindValue(':t2', TenantContext::id());
        $stmt->bindValue(':t3', TenantContext::id());
        $stmt->bindValue(':athlete_id2', $athleteId);
        $stmt->bindValue(':athlete_id3', $athleteId);
        $stmt->execute();

        $rows = $stmt->fetchAll();
        $vals = [];

        foreach ($rows as $row) {
            $m = json_decode($row['metrics'] ?? '{}', true) ?: [];
            $bi = $m['BrakingImpulse']['Value']
                ?? $m['EccentricBrakingImpulse']['Value']
                ?? $m['BrakingPhaseImpulse']['Value']
                ?? null;
            if ($bi !== null) {
                $vals[] = (float)$bi;
            }
        }

        return !empty($vals) ? round(array_sum($vals) / count($vals), 1) : null;
    }

    /**
     * Link (or unlink) an ERP athlete to a VALD athlete ID.
     * Pass null $valdAthleteId to remove the link.
     */
    public function linkAthleteToVald(string $athleteId, ?string $valdAthleteId): void
    {
        $stmt = $this->db->prepare(
            'UPDATE athletes SET vald_profile_id = :vid WHERE id = :id AND tenant_id = :tid'
        );
        $stmt->execute([
            ':vid' => $valdAthleteId,
            ':id'  => $athleteId,
            ':tid' => TenantContext::id(),
        ]);
    }
}