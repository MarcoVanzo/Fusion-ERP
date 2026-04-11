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

    /**
     * Helper to generate SEO-friendly slugs consistently
     */
    public static function slugify(string $text): string
    {
        $text = mb_strtolower($text, 'UTF-8');
        $text = preg_replace('/[^a-z0-9\-]/', '-', $text);
        $text = preg_replace('/-+/', '-', $text);
        return trim($text, '-');
    }

    public function getTeamIdForSeason(string $seasonId): ?string
    {
        $stmt = $this->db->prepare('SELECT team_id FROM team_seasons WHERE id = :id');
        $stmt->execute([':id' => $seasonId]);
        $val = $stmt->fetchColumn();
        return $val !== false ? (string)$val : null;
    }

    public function listAthletes(string $teamSeasonId = '', bool $includeInactive = false): array
    {
        $sql = 'SELECT DISTINCT a.id, a.team_id, a.full_name, a.jersey_number, a.role, a.birth_date,
                       a.height_cm, a.weight_kg, a.photo_path, a.is_active,
                       a.phone, a.email, a.fiscal_code, a.medical_cert_expires_at,
                       a.residence_address, a.residence_city, a.parent_contact, a.parent_phone,
                       COALESCE(t.name, "Nessuna squadra") AS team_name,
                       COALESCE(t.category, "Nessuna") AS category,
                       (SELECT GROUP_CONCAT(at_sub.team_season_id SEPARATOR ",") FROM athlete_teams at_sub WHERE at_sub.athlete_id = a.id) AS team_season_ids
                FROM athletes a
                LEFT JOIN teams t ON a.team_id = t.id';

        $params = [];
        if ($teamSeasonId !== '') {
            if (str_starts_with($teamSeasonId, 'TEAM_') || str_starts_with($teamSeasonId, 'TM_')) {
                // Support both legacy prefix and raw team_id format
                $sql .= ' WHERE a.deleted_at IS NULL AND a.team_id = :team_id';
                $params[':team_id'] = str_starts_with($teamSeasonId, 'TEAM_') ? substr($teamSeasonId, 5) : $teamSeasonId;
            } else {
                $sql .= ' JOIN athlete_teams at2 ON a.id = at2.athlete_id';
                $sql .= ' WHERE a.deleted_at IS NULL AND at2.team_season_id = :team_season_id';
                $params[':team_season_id'] = $teamSeasonId;
            }
        }
        else {
            $sql .= ' WHERE a.deleted_at IS NULL';
        }

        if (!$includeInactive) {
            $sql .= ' AND a.is_active = 1';
        }
        $sql .= ' ORDER BY a.full_name';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['team_season_ids'] = !empty($row['team_season_ids']) ? explode(',', $row['team_season_ids']) : [];
        }
        return $rows;
    }

    /**
     * PERF: Light version for the athlete list view
     */
    public function listAthletesLight(string $teamSeasonId = ''): array
    {
        // Build document columns dynamically
        $docCols = '';
        $docFields = ['contract_file_path', 'id_doc_front_file_path', 'id_doc_back_file_path',
                       'cf_doc_front_file_path', 'cf_doc_back_file_path', 'medical_cert_file_path',
                       'photo_release_file_path', 'privacy_policy_file_path', 'guesthouse_rules_file_path',
                       'guesthouse_delegate_file_path', 'health_card_file_path'];
        if ($this->_hasColumn('athletes', 'contract_file_path')) {
            $docCols = ', a.' . implode(', a.', $docFields);
        }

        $hasPaidField = '0';
        if ($this->_hasColumn('event_attendees', 'has_paid')) {
            $hasPaidField = 'ea.has_paid';
        }

        // VALD subqueries: only reference vald_profile_id if the column exists in production
        $hasValdProfileId = $this->_hasColumn('athletes', 'vald_profile_id');
        if ($hasValdProfileId) {
            $valdMetricsSub = "(SELECT metrics FROM vald_test_results WHERE athlete_id = a.id OR (a.vald_profile_id IS NOT NULL AND athlete_id IN (SELECT id FROM athletes WHERE vald_profile_id = a.vald_profile_id)) ORDER BY test_date DESC LIMIT 1)";
            $valdDateSub = "(SELECT test_date FROM vald_test_results WHERE athlete_id = a.id OR (a.vald_profile_id IS NOT NULL AND athlete_id IN (SELECT id FROM athletes WHERE vald_profile_id = a.vald_profile_id)) ORDER BY test_date DESC LIMIT 1)";
        } else {
            $valdMetricsSub = "(SELECT metrics FROM vald_test_results WHERE athlete_id = a.id ORDER BY test_date DESC LIMIT 1)";
            $valdDateSub = "(SELECT test_date FROM vald_test_results WHERE athlete_id = a.id ORDER BY test_date DESC LIMIT 1)";
        }

        $sql = "SELECT DISTINCT a.id, a.team_id, a.full_name, a.jersey_number, a.role, a.photo_path, a.is_active,
                       a.birth_date, a.height_cm, a.weight_kg,
                       a.quota_iscrizione_rata1, a.quota_iscrizione_rata1_paid,
                       a.quota_iscrizione_rata2, a.quota_iscrizione_rata2_paid,
                       a.quota_vestiario, a.quota_vestiario_paid,
                       a.quota_foresteria, a.quota_foresteria_paid,
                       a.quota_trasporti, a.quota_trasporti_paid,
                       a.quota_payment_deadline,
                       (SELECT GROUP_CONCAT(CONCAT_WS('||', td.event_id, e.title, IFNULL(td.fee_per_athlete, 0), IFNULL({$hasPaidField}, 0)) SEPARATOR ';;;') FROM event_attendees ea JOIN tournament_details td ON ea.event_id = td.event_id JOIN events e ON td.event_id = e.id WHERE ea.athlete_id = a.id AND ea.status = 'confirmed') AS tournaments_summary,
                       a.medical_cert_expires_at{$docCols},
                       COALESCE(t.name, 'Nessuna squadra') AS team_name,
                       COALESCE(t.category, 'Nessuna') AS category,
                       (SELECT GROUP_CONCAT(at_sub.team_season_id SEPARATOR ',') FROM athlete_teams at_sub WHERE at_sub.athlete_id = a.id) AS team_season_ids,
                       (SELECT GROUP_CONCAT(CONCAT_WS('||', ir.injury_date, ir.type, ir.current_status, IFNULL(ir.return_date, '')) SEPARATOR ';;;') FROM injury_records ir WHERE ir.athlete_id = a.id ORDER BY ir.injury_date DESC) AS injuries_summary,
                       {$valdMetricsSub} AS latest_vald_metrics,
                       {$valdDateSub} AS latest_vald_date
                FROM athletes a
                LEFT JOIN teams t ON a.team_id = t.id";

        $params = [];
        if ($teamSeasonId !== '') {
            if (str_starts_with($teamSeasonId, 'TEAM_') || str_starts_with($teamSeasonId, 'TM_')) {
                $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1 AND a.team_id = :team_id';
                $params[':team_id'] = str_starts_with($teamSeasonId, 'TEAM_') ? substr($teamSeasonId, 5) : $teamSeasonId;
            } else {
                $sql .= ' JOIN athlete_teams at2 ON a.id = at2.athlete_id';
                $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1 AND at2.team_season_id = :team_season_id';
                $params[':team_season_id'] = $teamSeasonId;
            }
        }
        else {
            $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1';
        }
        $sql .= ' ORDER BY a.full_name';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['team_season_ids'] = !empty($row['team_season_ids']) ? explode(',', $row['team_season_ids']) : [];
        }
        return $rows;
    }


    public function getAthleteById(string $id): ?array
    {
        $docCols = '';
        if ($this->_hasColumn('athletes', 'contract_file_path')) {
            $docCols = ', a.contract_file_path, a.id_doc_front_file_path, a.id_doc_back_file_path,
                    a.cf_doc_front_file_path, a.cf_doc_back_file_path, a.medical_cert_file_path,
                    a.photo_release_file_path, a.privacy_policy_file_path,
                    a.guesthouse_rules_file_path, a.guesthouse_delegate_file_path, a.health_card_file_path';
        }

        $stmt = $this->db->prepare(
            "SELECT a.id, a.user_id, a.team_id, a.full_name,
                    a.first_name, a.last_name,
                    a.jersey_number, a.role,
                    a.birth_date, a.birth_place,
                    a.height_cm, a.weight_kg, a.photo_path,
                    a.residence_address, a.residence_city,
                    a.fiscal_code, a.identity_document, a.federal_id,
                    a.email, a.phone,
                    a.parent_contact, a.parent_phone,
                    a.nationality, a.blood_group, a.allergies, a.medications,
                    a.emergency_contact_name, a.emergency_contact_phone,
                    a.communication_preference, a.image_release_consent,
                    a.medical_cert_type, a.medical_cert_expires_at, a.medical_cert_issued_at{$docCols},
                    a.quota_iscrizione_rata1, a.quota_iscrizione_rata1_paid,
                    a.quota_iscrizione_rata2, a.quota_iscrizione_rata2_paid,
                    a.quota_vestiario, a.quota_vestiario_paid,
                    a.quota_foresteria, a.quota_foresteria_paid,
                    a.quota_trasporti, a.quota_trasporti_paid,

                    a.quota_payment_deadline,
                    a.shirt_size, a.shoe_size,
                    a.is_active,
                    t.name AS team_name, t.category
             FROM athletes a
             LEFT JOIN teams t ON a.team_id = t.id
             WHERE a.id = :id AND a.deleted_at IS NULL
             LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) return null;

        $teams = $this->getAthleteTeams($id);
        $row['team_ids'] = array_column($teams, 'team_season_id');
        $row['team_names'] = $teams;
        if (empty($row['team_ids']) && !empty($row['team_id'])) {
            $row['team_ids'] = [$row['team_id']];
        }
        return $row;
    }

    public function getAthleteByUserId(string $userId): ?array
    {
        $docCols = '';
        if ($this->_hasColumn('athletes', 'contract_file_path')) {
            $docCols = ', a.contract_file_path, a.id_doc_front_file_path, a.id_doc_back_file_path,
                    a.cf_doc_front_file_path, a.cf_doc_back_file_path, a.medical_cert_file_path,
                    a.photo_release_file_path, a.privacy_policy_file_path,
                    a.guesthouse_rules_file_path, a.guesthouse_delegate_file_path, a.health_card_file_path';
        }

        $stmt = $this->db->prepare(
            "SELECT a.id, a.user_id, a.team_id, a.full_name,
                    a.first_name, a.last_name,
                    a.jersey_number, a.role,
                    a.birth_date, a.birth_place,
                    a.height_cm, a.weight_kg, a.photo_path,
                    a.residence_address, a.residence_city,
                    a.fiscal_code, a.identity_document, a.federal_id,
                    a.email, a.phone,
                    a.parent_contact, a.parent_phone,
                    a.nationality, a.blood_group, a.allergies, a.medications,
                    a.emergency_contact_name, a.emergency_contact_phone,
                    a.communication_preference, a.image_release_consent,
                    a.medical_cert_type, a.medical_cert_expires_at, a.medical_cert_issued_at{$docCols},
                    a.quota_iscrizione_rata1, a.quota_iscrizione_rata1_paid,
                    a.quota_iscrizione_rata2, a.quota_iscrizione_rata2_paid,
                    a.quota_vestiario, a.quota_vestiario_paid,
                    a.quota_foresteria, a.quota_foresteria_paid,
                    a.quota_trasporti, a.quota_trasporti_paid,

                    a.quota_payment_deadline,
                    a.shirt_size, a.shoe_size,
                    a.is_active,
                    t.name AS team_name, t.category
             FROM athletes a
             LEFT JOIN teams t ON a.team_id = t.id
             WHERE a.user_id = :user_id AND a.deleted_at IS NULL
             LIMIT 1"
        );
        $stmt->execute([':user_id' => $userId]);
        $row = $stmt->fetch();
        if (!$row) return null;

        $teams = $this->getAthleteTeams($row['id']);
        $row['team_ids'] = array_column($teams, 'team_season_id');
        $row['team_names'] = $teams;
        return $row;
    }

    public function getAthleteByEmail(string $email): ?array
    {
        $docCols = '';
        if ($this->_hasColumn('athletes', 'contract_file_path')) {
            $docCols = ', a.contract_file_path, a.id_doc_front_file_path, a.id_doc_back_file_path,
                    a.cf_doc_front_file_path, a.cf_doc_back_file_path, a.medical_cert_file_path,
                    a.photo_release_file_path, a.privacy_policy_file_path,
                    a.guesthouse_rules_file_path, a.guesthouse_delegate_file_path, a.health_card_file_path';
        }

        $stmt = $this->db->prepare(
            "SELECT a.id, a.user_id, a.team_id, a.full_name,
                    a.first_name, a.last_name,
                    a.jersey_number, a.role,
                    a.birth_date, a.birth_place,
                    a.height_cm, a.weight_kg, a.photo_path,
                    a.residence_address, a.residence_city,
                    a.fiscal_code, a.identity_document, a.federal_id,
                    a.email, a.phone,
                    a.parent_contact, a.parent_phone,
                    a.nationality, a.blood_group, a.allergies, a.medications,
                    a.emergency_contact_name, a.emergency_contact_phone,
                    a.communication_preference, a.image_release_consent,
                    a.medical_cert_type, a.medical_cert_expires_at, a.medical_cert_issued_at{$docCols},
                    a.quota_iscrizione_rata1, a.quota_iscrizione_rata1_paid,
                    a.quota_iscrizione_rata2, a.quota_iscrizione_rata2_paid,
                    a.quota_vestiario, a.quota_vestiario_paid,
                    a.quota_foresteria, a.quota_foresteria_paid,
                    a.quota_trasporti, a.quota_trasporti_paid,

                    a.quota_payment_deadline,
                    a.shirt_size, a.shoe_size,
                    a.is_active,
                    t.name AS team_name, t.category
             FROM athletes a
             LEFT JOIN teams t ON a.team_id = t.id
             WHERE a.email = :email AND a.deleted_at IS NULL
             LIMIT 1"
        );
        $stmt->execute([':email' => $email]);
        $row = $stmt->fetch();
        if (!$row) return null;

        $teams = $this->getAthleteTeams($row['id']);
        $row['team_ids'] = array_column($teams, 'team_season_id');
        $row['team_names'] = $teams;
        return $row;
    }

    public function getAthleteTeams(string $athleteId): array
    {
        try {
            $stmt = $this->db->prepare(
                'SELECT ts.id AS team_season_id, t.id AS team_id, t.name, t.category, ts.season
                 FROM athlete_teams at2
                 JOIN team_seasons ts ON ts.id = at2.team_season_id
                 JOIN teams t ON t.id = ts.team_id
                 WHERE at2.athlete_id = :id
                   AND t.deleted_at IS NULL
                 ORDER BY ts.season DESC, t.category, t.name'
            );
            $stmt->execute([':id' => $athleteId]);
            return $stmt->fetchAll();
        }
        catch (\Throwable) {
            return [];
        }
    }

    public function setAthleteTeams(string $athleteId, array $teamSeasonIds, ?string $primaryTeamId = null): void
    {
        try {
            $this->db->beginTransaction();
            $del = $this->db->prepare('DELETE FROM athlete_teams WHERE athlete_id = :id');
            $del->execute([':id' => $athleteId]);

            if (!empty($teamSeasonIds)) {
                $ins = $this->db->prepare(
                    'INSERT IGNORE INTO athlete_teams (athlete_id, team_season_id) VALUES (:athlete_id, :team_season_id)'
                );
                foreach ($teamSeasonIds as $tsid) {
                    if (!empty($tsid)) {
                        $ins->execute([':athlete_id' => $athleteId, ':team_season_id' => $tsid]);
                    }
                }
            }
            
            if ($primaryTeamId !== null) {
                $upd = $this->db->prepare('UPDATE athletes SET team_id = :team_id WHERE id = :id');
                $upd->execute([':team_id' => $primaryTeamId, ':id' => $athleteId]);
            }
            $this->db->commit();
        }
        catch (\Throwable $e) {
            $this->db->rollBack();
            error_log('[athlete_teams] setAthleteTeams failed: ' . $e->getMessage());
        }
    }

    public function createAthlete(array $data): void
    {
        $stmt = $this->db->prepare(
            'INSERT INTO athletes (
                `id`, `user_id`, `team_id`,
                `first_name`, `last_name`, `full_name`,
                `jersey_number`, `role`,
                `birth_date`, `birth_place`,
                `height_cm`, `weight_kg`,
                `photo_path`,
                `residence_address`, `residence_city`,
                `fiscal_code`, `identity_document`, `federal_id`,
                `email`, `phone`,
                `parent_contact`, `parent_phone`,
                `nationality`, `blood_group`, `allergies`, `medications`,
                `emergency_contact_name`, `emergency_contact_phone`,
                `communication_preference`, `image_release_consent`,
                `medical_cert_type`, `medical_cert_expires_at`, `medical_cert_issued_at`,
                `photo_release_file_path`, `privacy_policy_file_path`,
                `guesthouse_rules_file_path`, `guesthouse_delegate_file_path`, `health_card_file_path`,
                `shirt_size`, `shoe_size`,
                `is_active`
             ) VALUES (
                :id, :user_id, :team_id,
                :first_name, :last_name, :full_name,
                :jersey_number, :role,
                :birth_date, :birth_place,
                :height_cm, :weight_kg,
                :photo_path,
                :residence_address, :residence_city,
                :fiscal_code, :identity_document, :federal_id,
                :email, :phone,
                :parent_contact, :parent_phone,
                :nationality, :blood_group, :allergies, :medications,
                :emergency_contact_name, :emergency_contact_phone,
                :communication_preference, :image_release_consent,
                :medical_cert_type, :medical_cert_expires_at, :medical_cert_issued_at,
                :photo_release_file_path, :privacy_policy_file_path,
                :guesthouse_rules_file_path, :guesthouse_delegate_file_path, :health_card_file_path,
                :shirt_size, :shoe_size,
                1
             )'
        );
        $stmt->execute($data);
    }

    public function updateAthlete(string $id, array $data): void
    {
        $params = [':id' => $id];
        $setClauses = [];
        foreach ($data as $key => $value) {
            $cleanKey = ltrim($key, ':');
            $setClauses[] = "`{$cleanKey}` = :{$cleanKey}";
            $params[":{$cleanKey}"] = $value;
        }
        
        $sql = 'UPDATE athletes SET ' . implode(', ', $setClauses) . ' WHERE id = :id AND deleted_at IS NULL';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
    }

    public function softDeleteAthlete(string $id): void
    {
        $stmt = $this->db->prepare('UPDATE athletes SET deleted_at = NOW() WHERE id = :id');
        $stmt->execute([':id' => $id]);
    }

    public function updatePhotoPath(string $id, ?string $photoPath): void
    {
        $stmt = $this->db->prepare(
            'UPDATE athletes SET `photo_path` = :photo_path WHERE id = :id AND deleted_at IS NULL'
        );
        $stmt->execute([':photo_path' => $photoPath, ':id' => $id]);
    }

    public function updateDocumentPath(string $id, string $dbField, ?string $path): void
    {
        $stmt = $this->db->prepare(
            "UPDATE athletes SET `{$dbField}` = :path WHERE id = :id AND deleted_at IS NULL"
        );
        $stmt->execute([':path' => $path, ':id' => $id]);
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

    public function getAcwrLoads(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT
                COALESCE(SUM(CASE WHEN log_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)  THEN load_value ELSE 0 END), 0)      AS acute,
                COALESCE(SUM(CASE WHEN log_date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY) THEN load_value ELSE 0 END), 0) / 4  AS chronic
             FROM metrics_logs
             WHERE athlete_id = :id
               AND log_date >= DATE_SUB(CURDATE(), INTERVAL 28 DAY)'
        );
        $stmt->execute([':id' => $athleteId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        return [
            'acute' => (float)($row['acute'] ?? 0),
            'chronic' => (float)($row['chronic'] ?? 0),
        ];
    }

    public function getMetricsHistory(string $athleteId, int $days = 30): array
    {
        $daysInt = (int)$days;
        $daysIntStr = (string)$daysInt;
        $stmt = $this->db->prepare(
            "SELECT id, log_date, duration_min, rpe, load_value, acwr_score, notes
             FROM metrics_logs
             WHERE athlete_id = :id AND log_date >= DATE_SUB(CURDATE(), INTERVAL " . $daysIntStr . " DAY)
             ORDER BY log_date DESC"
        );
        $stmt->bindValue(':id', $athleteId);
        $stmt->execute();
        return $stmt->fetchAll();
    }

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

    // listPendingSync removed — 'sync_status' column does not exist in the athletes schema.

    public function linkUserToAthlete(string $athleteId, string $userId): void
    {
        $stmt = $this->db->prepare('UPDATE athletes SET user_id = :user_id, updated_at = NOW() WHERE id = :id');
        $stmt->execute([':user_id' => $userId, ':id' => $athleteId]);
    }

    // ─── PUBLIC WEBSITE ATHLETES ─────────────────────────────────────────────

    public function listPublicAthletes(string $teamSeasonId = ''): array
    {
        $sql = 'SELECT DISTINCT a.id, a.full_name, a.first_name, a.last_name,
                       a.jersey_number, a.role, a.photo_path,
                       a.height_cm, a.weight_kg
                FROM athletes a';

        $params = [];
        if ($teamSeasonId !== '') {
            if (str_starts_with($teamSeasonId, 'TEAM_')) {
                $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1 AND a.team_id = :team_id';
                $params[':team_id'] = substr($teamSeasonId, 5);
            } else {
                $sql .= ' JOIN athlete_teams at2 ON a.id = at2.athlete_id';
                $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1 AND at2.team_season_id = :team_season_id';
                $params[':team_season_id'] = $teamSeasonId;
            }
        } else {
            $sql .= ' WHERE a.deleted_at IS NULL AND a.is_active = 1';
        }
        $sql .= ' ORDER BY a.jersey_number ASC, a.full_name ASC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    // ─── TEAMS ────────────────────────────────────────────────────────────────

    public function listTeams(): array
    {
        $stmt = $this->db->prepare(
            'SELECT ts.id AS id, t.id AS team_id, t.name, t.category, t.color_hex, ts.season
             FROM team_seasons ts
             JOIN teams t ON ts.team_id = t.id
             WHERE t.deleted_at IS NULL AND t.is_active = 1
             ORDER BY ts.season DESC, t.category, t.name'
        );
        $stmt->execute();
        $teams = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        return array_map(function($team) {
            $team['slug'] = self::slugify($team['name']);
            return $team;
        }, $teams);
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

    // ─── TRANSPORT HISTORY ───────────────────────────────────────────────────

    public function getTransportHistory(string $athleteId): array
    {
        $stmt = $this->db->prepare(
            'SELECT destination_name, transport_date, departure_time, arrival_time
             FROM transports
             WHERE JSON_CONTAINS(athletes_json, JSON_OBJECT(\'id\', :id))
             ORDER BY transport_date DESC, departure_time DESC'
        );
        $stmt->execute([':id' => $athleteId]);
        return $stmt->fetchAll();
    }

    // ─── TOURNAMENT HISTORY ──────────────────────────────────────────────────

    public function getTournamentHistory(string $athleteId): array
    {
        // Safety check logic against missing column during migration run
        $hasPaidField = '0 AS has_paid';
        if ($this->_hasColumn('event_attendees', 'has_paid')) {
            $hasPaidField = 'ea.has_paid';
        }

        $stmt = $this->db->prepare(
            "SELECT e.id AS event_id, e.title AS tournament_name, e.event_date AS tournament_date, td.fee_per_athlete, {$hasPaidField}
             FROM event_attendees ea
             JOIN events e ON e.id = ea.event_id
             JOIN tournament_details td ON td.event_id = e.id
             WHERE ea.athlete_id = :id AND ea.status = 'confirmed'
             ORDER BY e.event_date DESC"
        );
        $stmt->execute([':id' => $athleteId]);
        return $stmt->fetchAll();
    }

    public function setTournamentPayment(string $athleteId, string $eventId, bool $hasPaid): void
    {
        $stmt = $this->db->prepare(
            'UPDATE event_attendees SET has_paid = :has_paid 
             WHERE athlete_id = :athlete_id AND event_id = :event_id'
        );
        $stmt->execute([
            ':has_paid' => $hasPaid ? 1 : 0,
            ':athlete_id' => $athleteId,
            ':event_id' => $eventId
        ]);
    }

    // ─── ACTIVITY LOG ────────────────────────────────────────────────────────

    public function getActivityLog(string $athleteId): array
    {
        $useGeneratedCol = $this->_hasColumn('audit_logs', 'json_entity_id');

        $sql = function (string $whereClause) use ($athleteId): array {
            $stmt = $this->db->prepare(
                "SELECT al.id, al.action, al.table_name, al.created_at,
                        COALESCE(u.email, al.user_id, 'Sistema') AS operator,
                        al.after_snapshot, al.before_snapshot
                 FROM audit_logs al
                 LEFT JOIN users u ON al.user_id = u.id
                 WHERE {$whereClause}
                 ORDER BY al.created_at DESC
                 LIMIT 5"
            );
            $stmt->bindValue(':athlete_id', $athleteId);
            $stmt->execute();
            return $stmt->fetchAll();
        };

        if ($useGeneratedCol) {
            return [
                'anagrafica' => $sql("al.table_name = 'athletes' AND al.record_id = :athlete_id"),
                'metrics' => $sql("al.table_name = 'metrics_logs' AND al.json_entity_id = :athlete_id"),
                'documenti' => $sql("al.table_name = 'athlete_documents' AND al.json_entity_id = :athlete_id"),
            ];
        }

        return [
            'anagrafica' => $sql("al.table_name IN ('athletes') AND al.record_id = :athlete_id"),
            'metrics' => $sql("al.table_name = 'metrics_logs' AND JSON_UNQUOTE(JSON_EXTRACT(al.after_snapshot, '$.athlete_id')) = :athlete_id"),
            'documenti' => $sql("al.table_name = 'athlete_documents' AND JSON_UNQUOTE(JSON_EXTRACT(al.after_snapshot, '$.athlete_id')) = :athlete_id"),
        ];
    }

    /** Check if a column exists in a table */
    private function _hasColumn(string $table, string $column): bool
    {
        try {
            $stmt = $this->db->prepare(
                "SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME   = :tbl
                   AND COLUMN_NAME  = :col"
            );
            $stmt->execute([':tbl' => $table, ':col' => $column]);
            return (int)$stmt->fetchColumn() > 0;
        }
        catch (\Throwable) {
            return false;
        }
    }
}