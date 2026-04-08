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
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? filter_input(INPUT_GET, 'athlete_id', FILTER_DEFAULT) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $status = $this->repo->getCertificateStatus($athleteId);
        Response::success($status);
    }

    // ─── ANAMNESI ────────────────────────────────────────────────────────────

    /**
     * Get athlete's health history (Anamnesi Generale/Ortopedica).
     */
    public function getAnamnesi(): void
    {
        Auth::requireRead('health');
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? filter_input(INPUT_GET, 'athlete_id', FILTER_DEFAULT) ?? '';
        if (empty($athleteId)) {
            Response::error('id atleta obbligatorio', 400);
        }

        $anamnesi = $this->repo->getAnamnesi($athleteId);
        Response::success($anamnesi);
    }

    /**
     * Update athlete's health history.
     */
    public function updateAnamnesi(): void
    {
        Auth::requireWrite('health');
        $body = Response::jsonBody();
        Response::requireFields($body, ['athlete_id']);

        $this->repo->updateAnamnesi($body['athlete_id'], [
            ':blood_type' => $body['blood_type'] ?? null,
            ':regular_medications' => $body['regular_medications'] ?? null,
            ':chronic_conditions' => $body['chronic_conditions'] ?? null,
            ':past_surgeries' => $body['past_surgeries'] ?? null,
        ]);

        Audit::log('UPDATE', 'athletes_health', $body['athlete_id'], null, $body);

        Response::success(['message' => 'Anamnesi aggiornata']);
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
            ':athlete_id' => $body['athlete_id'],
            ':injury_date' => $body['injury_date'],
            ':description' => $body['description'] ?? null,
            ':status' => $body['status'] ?? 'active',
            ':diagnosis' => $body['diagnosis'] ?? null,
            ':treatment' => $body['treatment'] ?? null,
            ':injury_type' => $body['injury_type'] ?? null,
            ':body_part' => $body['body_part'] ?? null,
            ':mechanism' => $body['mechanism'] ?? null,
            ':expected_rtp_date' => $body['expected_rtp_date'] ?? null,
            ':rtp_cleared' => !empty($body['rtp_cleared']) ? 1 : 0,
            ':surgery_required' => !empty($body['surgery_required']) ? 1 : 0,
            ':surgery_date' => $body['surgery_date'] ?? null,
            ':physio_plan' => $body['physio_plan'] ?? null,
            ':assigned_physio' => $body['assigned_physio'] ?? null,
            ':current_status' => $body['current_status'] ?? null,
            ':estimated_recovery_time' => $body['estimated_recovery_time'] ?? null,
            ':estimated_return_date' => $body['estimated_return_date'] ?? null,
            ':medical_clearance_given' => !empty($body['medical_clearance_given']) ? 1 : 0,
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
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? filter_input(INPUT_GET, 'athlete_id', FILTER_DEFAULT) ?? '';
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

        $updateData = [];
        $allowedFields = ['description', 'status', 'diagnosis', 'treatment', 'injury_type', 'body_part', 'mechanism', 'expected_rtp_date', 'rtp_cleared', 'surgery_required', 'surgery_date', 'physio_plan', 'assigned_physio', 'current_status', 'estimated_recovery_time', 'estimated_return_date', 'medical_clearance_given', 'injury_date'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $body)) {
                if (in_array($field, ['rtp_cleared', 'surgery_required', 'medical_clearance_given'])) {
                    $updateData[":$field"] = !empty($body[$field]) ? 1 : 0;
                } else {
                    $updateData[":$field"] = $body[$field];
                }
            }
        }

        if (empty($updateData)) {
            Response::success(['message' => 'Niente da aggiornare']);
        }

        $this->repo->updateInjury($body['injury_id'], $updateData);

        Audit::log('UPDATE', 'injury_records', $body['injury_id'], null, $body);
        Response::success(['message' => 'Infortunio aggiornato']);
    }
}