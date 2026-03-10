<?php
/**
 * Network Repository — DB queries for network_* tables
 * Fusion ERP v1.0
 */

declare(strict_types=1);

namespace FusionERP\Modules\Network;

$_networkShared = dirname(__DIR__, 2) . '/Shared/';
require_once $_networkShared . 'TenantContext.php';
unset($_networkShared);

use FusionERP\Shared\Database;
use FusionERP\Shared\TenantContext;

class NetworkRepository
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // ─── COLLABORATIONS ───────────────────────────────────────────────────────

    public function listCollaborations(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM network_collaborations
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY status ASC, partner_name ASC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getCollaborationById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM network_collaborations WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createCollaboration(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO network_collaborations
                (id, tenant_id, partner_name, partner_type, agreement_type, start_date, end_date,
                 status, referent_name, referent_contact, notes, logo_path)
             VALUES
                (:id, :tenant_id, :partner_name, :partner_type, :agreement_type, :start_date, :end_date,
                 :status, :referent_name, :referent_contact, :notes, :logo_path)'
        );
        $stmt->execute($data);
    }

    public function updateCollaboration(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'UPDATE network_collaborations SET
                partner_name        = :partner_name,
                partner_type        = :partner_type,
                agreement_type      = :agreement_type,
                start_date          = :start_date,
                end_date            = :end_date,
                status              = :status,
                referent_name       = :referent_name,
                referent_contact    = :referent_contact,
                notes               = :notes,
                logo_path           = :logo_path
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute(array_merge($data, [':id' => $id, ':tid' => $tenantId]));
    }

    public function updateColLogo(string $collabId, string $logoPath): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE network_collaborations SET logo_path = :lp WHERE id = :id AND tenant_id = :tid'
        )->execute([':lp' => $logoPath, ':id' => $collabId, ':tid' => $tenantId]);
    }

    public function deleteCollaboration(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE network_collaborations SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    // ─── COLLABORATION DOCUMENTS ───────────────────────────────────────────────

    public function listColDocuments(string $collaborationId): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM network_documents
             WHERE collaboration_id = :cid AND tenant_id = :tid AND is_deleted = 0
             ORDER BY uploaded_at DESC'
        );
        $stmt->execute([':cid' => $collaborationId, ':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getColDocumentById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM network_documents WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function insertColDocument(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO network_documents (id, tenant_id, collaboration_id, file_path, file_name, doc_type)
             VALUES (:id, :tenant_id, :collaboration_id, :file_path, :file_name, :doc_type)'
        );
        $stmt->execute($data);
    }

    public function deleteColDocument(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE network_documents SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    // ─── TRIALS ───────────────────────────────────────────────────────────────

    public function listTrials(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT t.*,
                    CONCAT(t.athlete_first_name, \' \', t.athlete_last_name) AS full_name,
                    AVG((e.score_technical + e.score_tactical + e.score_physical + e.score_mental + e.score_potential) / 5.0) AS avg_score,
                    COUNT(e.id) AS eval_count
             FROM network_trials t
             LEFT JOIN network_trial_evaluations e ON e.trial_id = t.id AND e.is_deleted = 0
             WHERE t.tenant_id = :tid AND t.is_deleted = 0
             GROUP BY t.id
             ORDER BY t.created_at DESC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getTrialById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM network_trials WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createTrial(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO network_trials
                (id, tenant_id, athlete_first_name, athlete_last_name, birth_date, nationality,
                 position, origin_club, trial_start, trial_end, status, notes)
             VALUES
                (:id, :tenant_id, :athlete_first_name, :athlete_last_name, :birth_date, :nationality,
                 :position, :origin_club, :trial_start, :trial_end, :status, :notes)'
        );
        $stmt->execute($data);
    }

    public function updateTrial(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'UPDATE network_trials SET
                athlete_first_name = :athlete_first_name,
                athlete_last_name  = :athlete_last_name,
                birth_date         = :birth_date,
                nationality        = :nationality,
                position           = :position,
                origin_club        = :origin_club,
                trial_start        = :trial_start,
                trial_end          = :trial_end,
                status             = :status,
                notes              = :notes
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute(array_merge($data, [':id' => $id, ':tid' => $tenantId]));
    }

    public function deleteTrial(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE network_trials SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    public function setTrialScoutingProfile(string $trialId, string $scoutingProfileId): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE network_trials SET scouting_profile_id = :spid WHERE id = :id AND tenant_id = :tid'
        )->execute([':spid' => $scoutingProfileId, ':id' => $trialId, ':tid' => $tenantId]);
    }

    // ─── EVALUATIONS ──────────────────────────────────────────────────────────

    public function listEvaluations(string $trialId): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM network_trial_evaluations
             WHERE trial_id = :tid_trial AND tenant_id = :tid AND is_deleted = 0
             ORDER BY eval_date DESC'
        );
        $stmt->execute([':tid_trial' => $trialId, ':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function insertEvaluation(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO network_trial_evaluations
                (id, tenant_id, trial_id, evaluator_user_id, eval_date,
                 score_technical, score_tactical, score_physical, score_mental, score_potential,
                 notes, video_url)
             VALUES
                (:id, :tenant_id, :trial_id, :evaluator_user_id, :eval_date,
                 :score_technical, :score_tactical, :score_physical, :score_mental, :score_potential,
                 :notes, :video_url)'
        );
        $stmt->execute($data);
    }

    // ─── ACTIVITIES ───────────────────────────────────────────────────────────

    public function listActivities(): array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM network_activities
             WHERE tenant_id = :tid AND is_deleted = 0
             ORDER BY date DESC'
        );
        $stmt->execute([':tid' => $tenantId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function getActivityById(string $id): ?array
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'SELECT * FROM network_activities WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute([':id' => $id, ':tid' => $tenantId]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public function createActivity(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO network_activities
                (id, tenant_id, title, activity_type, date, location, participants_json, outcome, notes)
             VALUES
                (:id, :tenant_id, :title, :activity_type, :date, :location, :participants_json, :outcome, :notes)'
        );
        $stmt->execute($data);
    }

    public function updateActivity(string $id, array $data): void
    {
        $tenantId = TenantContext::id();
        $stmt = $this->db->prepare(
            'UPDATE network_activities SET
                title              = :title,
                activity_type      = :activity_type,
                date               = :date,
                location           = :location,
                participants_json  = :participants_json,
                outcome            = :outcome,
                notes              = :notes
             WHERE id = :id AND tenant_id = :tid AND is_deleted = 0'
        );
        $stmt->execute(array_merge($data, [':id' => $id, ':tid' => $tenantId]));
    }

    public function deleteActivity(string $id): void
    {
        $tenantId = TenantContext::id();
        $this->db->prepare(
            'UPDATE network_activities SET is_deleted = 1 WHERE id = :id AND tenant_id = :tid'
        )->execute([':id' => $id, ':tid' => $tenantId]);
    }

    // ─── Scouting hook (defensive) ────────────────────────────────────────────

    /**
     * Check whether the scouting table exists (scouting module may not be deployed yet).
     */
    public function scoutingTableExists(): bool
    {
        try {
            $stmt = $this->db->query("SELECT 1 FROM scouting_profiles LIMIT 1");
            return $stmt !== false;
        }
        catch (\Throwable) {
            return false;
        }
    }

    public function insertScoutingProfile(array $data): string
    {
        $stmt = $this->db->prepare(
            'INSERT INTO scouting_profiles
                (id, tenant_id, first_name, last_name, birth_date, nationality, position, origin_club, notes)
             VALUES
                (:id, :tenant_id, :first_name, :last_name, :birth_date, :nationality, :position, :origin_club, :notes)'
        );
        $stmt->execute($data);
        return $data[':id'];
    }
}