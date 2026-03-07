<?php
/**
 * Health Controller — Medical Certificates & Injuries
 * Fusion ERP v1.0 — Module C
 *
 * Endpoints:
 *   POST ?module=health&action=updateCertificate    — update medical certificate
 *   GET  ?module=health&action=getCertificateStatus — certificate status with alert
 *   POST ?module=health&action=addInjury            — log new injury
 *   GET  ?module=health&action=getInjuries          — injury history
 *   POST ?module=health&action=updateInjury         — update injury (return date)
 */

declare(strict_types=1);

namespace FusionERP\Modules\Health;

use FusionERP\Shared\Auth;
use FusionERP\Shared\Audit;
use FusionERP\Shared\Response;
use FusionERP\Shared\TenantContext;

class HealthController
{
    private HealthRepository $repo;

    public function __construct()
    {
        $this->repo = new HealthRepository();
    }

    // ─── POST ?module=health&action=updateCertificate ────────────────────────

    /**
     * Update the medical certificate for an athlete.
     */
    public function updateCertificate(): void
    {
        Auth::requireWrite('health');
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id']);

        $this->repo->updateCertificate($body['athlete_id'], [
            ':cert_type' => $body['cert_type'] ?? null,
            ':expires_at' => $body['expires_at'] ?? null,
            ':issued_at' => $body['issued_at'] ?? null,
            ':file_path' => $body['file_path'] ?? null,
        ]);

        Audit::log('UPDATE', 'athletes', $body['athlete_id'], null, [
            'field' => 'medical_certificate',
            'cert_type' => $body['cert_type'] ?? null,
            'expires_at' => $body['expires_at'] ?? null,
        ]);

        Response::success(['message' => 'Certificato medico aggiornato']);
    }

    // ─── GET ?module=health&action=getCertificateStatus&id=ATH_xxx ───────────

    /**
     * Returns certificate status with alert level.
     */
    public function getCertificateStatus(): void
    {
        Auth::requireRead('health');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $status = $this->repo->getCertificateStatus($athleteId);
        Response::success($status);
    }

    // ─── POST ?module=health&action=addInjury ────────────────────────────────

    /**
     * Log a new injury for an athlete.
     */
    public function addInjury(): void
    {
        Auth::requireWrite('health');
        $user = Auth::user();
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id', 'injury_date', 'type', 'body_part']);

        $id = 'INJ_' . bin2hex(random_bytes(4));
        $tenantId = TenantContext::id();

        $severity = $body['severity'] ?? 'moderate';
        if (!in_array($severity, ['mild', 'moderate', 'severe'], true)) {
            $severity = 'moderate';
        }

        $this->repo->insertInjury([
            ':id' => $id,
            ':tenant_id' => $tenantId,
            ':athlete_id' => $body['athlete_id'],
            ':injury_date' => $body['injury_date'],
            ':type' => $body['type'],
            ':body_part' => $body['body_part'],
            ':severity' => $severity,
            ':stop_days' => isset($body['stop_days']) ? (int)$body['stop_days'] : null,
            ':return_date' => $body['return_date'] ?? null,
            ':notes' => $body['notes'] ?? null,
            ':treated_by' => $body['treated_by'] ?? null,
            ':created_by' => $user['id'] ?? null,
        ]);

        Audit::log('INSERT', 'injury_records', $id, null, $body);
        Response::success(['id' => $id], 201);
    }

    // ─── GET ?module=health&action=getInjuries&id=ATH_xxx ────────────────────

    /**
     * Get injury history for an athlete.
     */
    public function getInjuries(): void
    {
        Auth::requireRead('health');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $injuries = $this->repo->getInjuries($athleteId);
        Response::success($injuries);
    }

    // ─── POST ?module=health&action=updateInjury ─────────────────────────────

    /**
     * Update an injury record (e.g. mark return-to-play date).
     */
    public function updateInjury(): void
    {
        Auth::requireWrite('health');
        $body = Response::jsonBody();
        Response::requireFields($body, ['injury_id']);

        $this->repo->updateInjury($body['injury_id'], [
            ':return_date' => $body['return_date'] ?? null,
            ':notes' => $body['notes'] ?? null,
            ':stop_days' => isset($body['stop_days']) ? (int)$body['stop_days'] : null,
        ]);

        Audit::log('UPDATE', 'injury_records', $body['injury_id'], null, $body);
        Response::success(['message' => 'Infortunio aggiornato']);
    }
}