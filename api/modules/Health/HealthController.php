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
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
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
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
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
            ':blood_group' => $body['blood_group'] ?? null,
            ':allergies' => $body['allergies'] ?? null,
            ':medications' => $body['medications'] ?? null,
            ':chronic_diseases' => $body['chronic_diseases'] ?? null,
            ':past_surgeries' => $body['past_surgeries'] ?? null,
            ':past_injuries' => $body['past_injuries'] ?? null,
            ':chronic_orthopedic_issues' => $body['chronic_orthopedic_issues'] ?? null,
            ':orthopedic_aids' => $body['orthopedic_aids'] ?? null,
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
            // New extended fields
            ':location_context' => $body['location_context'] ?? null,
            ':side' => $body['side'] ?? null,
            ':mechanism' => $body['mechanism'] ?? null,
            ':official_diagnosis' => $body['official_diagnosis'] ?? null,
            ':diagnosis_date' => $body['diagnosis_date'] ?? null,
            ':diagnosed_by' => $body['diagnosed_by'] ?? null,
            ':instrumental_tests' => $body['instrumental_tests'] ?? null,
            ':test_results' => $body['test_results'] ?? null,
            ':is_recurrence' => !empty($body['is_recurrence']) ? 1 : 0,
            ':treatment_type' => $body['treatment_type'] ?? null,
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
        $athleteId = filter_input(INPUT_GET, 'id', FILTER_DEFAULT) ?? '';
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
        $allowedFields = ['return_date', 'notes', 'stop_days', 'location_context', 'side', 'mechanism', 'official_diagnosis', 'diagnosis_date', 'diagnosed_by', 'instrumental_tests', 'test_results', 'is_recurrence', 'treatment_type', 'surgery_date', 'physio_plan', 'assigned_physio', 'current_status', 'estimated_recovery_time', 'estimated_return_date', 'medical_clearance_given', 'type', 'body_part', 'severity', 'injury_date', 'treated_by'];
        
        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $body)) {
                if (in_array($field, ['is_recurrence', 'medical_clearance_given'])) {
                    $updateData[":$field"] = !empty($body[$field]) ? 1 : 0;
                } else if ($field === 'stop_days') {
                    $updateData[":$field"] = isset($body[$field]) ? (int)$body[$field] : null;
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