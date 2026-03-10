-- ─────────────────────────────────────────────────────────────────────────────
-- V049__network.sql
-- Modulo Network: collaborazioni, prove atleti, valutazioni, attività
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Collaborazioni ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `network_collaborations` (
    `id`               VARCHAR(20)                                                        NOT NULL,
    `tenant_id`        VARCHAR(30)    NOT NULL,
    `partner_name`     VARCHAR(200)   NOT NULL,
    `partner_type`     ENUM('club','agenzia','istituzione','sponsor','altro')             NOT NULL DEFAULT 'altro',
    `agreement_type`   VARCHAR(100)   NULL,
    `start_date`       DATE           NULL,
    `end_date`         DATE           NULL,
    `status`           ENUM('attivo','scaduto','in_rinnovo')                              NOT NULL DEFAULT 'attivo',
    `referent_name`    VARCHAR(200)   NULL,
    `referent_contact` VARCHAR(200)   NULL,
    `notes`            TEXT           NULL,
    `created_at`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_deleted`       TINYINT(1)     NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_network_collab_tenant`  (`tenant_id`),
    KEY `idx_network_collab_status`  (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Documenti Collaborazioni ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `network_documents` (
    `id`                 VARCHAR(20)   NOT NULL,
    `tenant_id`          VARCHAR(30)   NOT NULL,
    `collaboration_id`   VARCHAR(20)   NOT NULL,
    `file_path`          VARCHAR(500)  NOT NULL,
    `file_name`          VARCHAR(255)  NOT NULL,
    `doc_type`           VARCHAR(100)  NULL,
    `uploaded_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_deleted`         TINYINT(1)    NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_network_docs_tenant`  (`tenant_id`),
    KEY `idx_network_docs_collab`  (`collaboration_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Atleti in Prova ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `network_trials` (
    `id`                  VARCHAR(20)                                                       NOT NULL,
    `tenant_id`           VARCHAR(30)    NOT NULL,
    `athlete_first_name`  VARCHAR(100)   NOT NULL,
    `athlete_last_name`   VARCHAR(100)   NOT NULL,
    `birth_date`          DATE           NULL,
    `nationality`         VARCHAR(100)   NULL,
    `position`            VARCHAR(100)   NULL,
    `origin_club`         VARCHAR(200)   NULL,
    `trial_start`         DATE           NULL,
    `trial_end`           DATE           NULL,
    `status`              ENUM('in_valutazione','approvato','non_idoneo','da_ricontattare') NOT NULL DEFAULT 'in_valutazione',
    `scouting_profile_id` VARCHAR(30)    NULL COMMENT 'FK to scouting table after conversion',
    `notes`               TEXT           NULL,
    `created_at`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`          DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_deleted`          TINYINT(1)     NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_network_trials_tenant`  (`tenant_id`),
    KEY `idx_network_trials_status`  (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Valutazioni Prove ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `network_trial_evaluations` (
    `id`               VARCHAR(20)   NOT NULL,
    `tenant_id`        VARCHAR(30)   NOT NULL,
    `trial_id`         VARCHAR(20)   NOT NULL,
    `evaluator_user_id` VARCHAR(30)  NULL,
    `eval_date`        DATE          NOT NULL,
    `score_technical`  TINYINT       NOT NULL DEFAULT 5 COMMENT '1-10',
    `score_tactical`   TINYINT       NOT NULL DEFAULT 5 COMMENT '1-10',
    `score_physical`   TINYINT       NOT NULL DEFAULT 5 COMMENT '1-10',
    `score_mental`     TINYINT       NOT NULL DEFAULT 5 COMMENT '1-10',
    `score_potential`  TINYINT       NOT NULL DEFAULT 5 COMMENT '1-10',
    `notes`            TEXT          NULL,
    `video_url`        VARCHAR(1000) NULL,
    `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_deleted`       TINYINT(1)    NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_network_eval_tenant`  (`tenant_id`),
    KEY `idx_network_eval_trial`   (`trial_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Attività di Network ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `network_activities` (
    `id`                VARCHAR(20)   NOT NULL,
    `tenant_id`         VARCHAR(30)   NOT NULL,
    `title`             VARCHAR(255)  NOT NULL,
    `activity_type`     VARCHAR(100)  NULL,
    `date`              DATE          NOT NULL,
    `location`          VARCHAR(255)  NULL,
    `participants_json` LONGTEXT      NULL COMMENT 'JSON array of participant names/ids',
    `outcome`           VARCHAR(500)  NULL,
    `notes`             TEXT          NULL,
    `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_deleted`        TINYINT(1)    NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_network_acts_tenant`  (`tenant_id`),
    KEY `idx_network_acts_date`    (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
