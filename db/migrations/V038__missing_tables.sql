-- ─────────────────────────────────────────────────────────────────────────────
-- V038__missing_tables.sql
-- Fusion ERP — Crea le tabelle usate dal codice PHP ma assenti nel DB.
-- Tutte le CREATE usano IF NOT EXISTS → idempotenti e sicure da eseguire più volte.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── BIOMETRIC RECORDS ───────────────────────────────────────────────────────
-- Usata da: BiometricsRepository (Module Biometrics)
CREATE TABLE IF NOT EXISTS `biometric_records` (
    `id`           VARCHAR(20)     NOT NULL,
    `tenant_id`    VARCHAR(20)     DEFAULT NULL,
    `athlete_id`   VARCHAR(20)     NOT NULL,
    `record_date`  DATE            NOT NULL,
    `height_cm`    SMALLINT        DEFAULT NULL,
    `weight_kg`    DECIMAL(5,1)    DEFAULT NULL,
    `bmi`          DECIMAL(4,1)    DEFAULT NULL,
    `wingspan_cm`  SMALLINT        DEFAULT NULL,
    `measured_by`  VARCHAR(100)    DEFAULT NULL,
    `notes`        TEXT            DEFAULT NULL,
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_br_athlete` (`athlete_id`),
    KEY `idx_br_date`    (`record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ATHLETIC METRICS ────────────────────────────────────────────────────────
-- Usata da: BiometricsRepository (Module Biometrics)
CREATE TABLE IF NOT EXISTS `athletic_metrics` (
    `id`           VARCHAR(20)     NOT NULL,
    `tenant_id`    VARCHAR(20)     DEFAULT NULL,
    `athlete_id`   VARCHAR(20)     NOT NULL,
    `record_date`  DATE            NOT NULL,
    `metric_type`  VARCHAR(50)     NOT NULL  COMMENT 'Es: SPRINT_10M, VO2MAX, JUMP_CMJ',
    `value`        DECIMAL(8,2)    NOT NULL,
    `unit`         VARCHAR(20)     DEFAULT NULL  COMMENT 'Es: m/s, cm, ml/kg/min',
    `measured_by`  VARCHAR(100)    DEFAULT NULL,
    `notes`        TEXT            DEFAULT NULL,
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_am_athlete`     (`athlete_id`),
    KEY `idx_am_type_date`   (`athlete_id`, `metric_type`, `record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ATHLETE DOCUMENTS ───────────────────────────────────────────────────────
-- Usata da: DocumentsRepository (Module Documents)
CREATE TABLE IF NOT EXISTS `athlete_documents` (
    `id`           VARCHAR(20)     NOT NULL,
    `tenant_id`    VARCHAR(20)     DEFAULT NULL,
    `athlete_id`   VARCHAR(20)     NOT NULL,
    `doc_type`     VARCHAR(50)     NOT NULL COMMENT 'ID_CARD, PASSPORT, FEDERATION_CARD, etc.',
    `file_name`    VARCHAR(255)    NOT NULL,
    `file_path`    VARCHAR(500)    NOT NULL,
    `upload_date`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expiry_date`  DATE            DEFAULT NULL,
    `uploaded_by`  VARCHAR(20)     DEFAULT NULL,
    `deleted_at`   DATETIME        DEFAULT NULL,
    `created_at`   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ad_athlete`    (`athlete_id`),
    KEY `idx_ad_deleted`    (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CARPOOL ROUTES ──────────────────────────────────────────────────────────
-- Usata da: TransportRepository (Module Transport)
CREATE TABLE IF NOT EXISTS `carpool_routes` (
    `id`                  VARCHAR(20)     NOT NULL,
    `event_id`            VARCHAR(20)     NOT NULL,
    `driver_user_id`      VARCHAR(20)     NOT NULL,
    `meeting_point_name`  VARCHAR(255)    DEFAULT NULL,
    `meeting_point_lat`   DECIMAL(10,7)   DEFAULT NULL,
    `meeting_point_lng`   DECIMAL(10,7)   DEFAULT NULL,
    `departure_time`      DATETIME        DEFAULT NULL,
    `seats_total`         TINYINT         NOT NULL DEFAULT 4,
    `seats_available`     TINYINT         NOT NULL DEFAULT 4,
    `distance_km`         DECIMAL(7,2)    DEFAULT NULL,
    `reimbursement_eur`   DECIMAL(8,2)    DEFAULT NULL,
    `status`              ENUM('open','full','cancelled') NOT NULL DEFAULT 'open',
    `notes`               TEXT            DEFAULT NULL,
    `deleted_at`          DATETIME        DEFAULT NULL,
    `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_cr_event`  (`event_id`),
    KEY `idx_cr_driver` (`driver_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CARPOOL PASSENGERS ──────────────────────────────────────────────────────
-- Usata da: TransportRepository (Module Transport)
CREATE TABLE IF NOT EXISTS `carpool_passengers` (
    `id`              INT             NOT NULL AUTO_INCREMENT,
    `route_id`        VARCHAR(20)     NOT NULL,
    `athlete_id`      VARCHAR(20)     NOT NULL,
    `requested_by`    VARCHAR(20)     DEFAULT NULL,
    `pickup_lat`      DECIMAL(10,7)   DEFAULT NULL,
    `pickup_lng`      DECIMAL(10,7)   DEFAULT NULL,
    `pickup_address`  VARCHAR(255)    DEFAULT NULL,
    `status`          ENUM('requested','confirmed','cancelled') NOT NULL DEFAULT 'requested',
    `confirmed_at`    DATETIME        DEFAULT NULL,
    `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_cp_route`   (`route_id`),
    KEY `idx_cp_athlete` (`athlete_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── EVENT ATTENDEES ─────────────────────────────────────────────────────────
-- Usata da: TransportRepository (Module Transport)
CREATE TABLE IF NOT EXISTS `event_attendees` (
    `id`          INT             NOT NULL AUTO_INCREMENT,
    `event_id`    VARCHAR(20)     NOT NULL,
    `athlete_id`  VARCHAR(20)     DEFAULT NULL,
    `user_id`     VARCHAR(20)     DEFAULT NULL,
    `status`      ENUM('invited','confirmed','declined','absent') NOT NULL DEFAULT 'invited',
    `notes`       TEXT            DEFAULT NULL,
    `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ea_event`   (`event_id`),
    KEY `idx_ea_athlete` (`athlete_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── EMAIL LOGS ──────────────────────────────────────────────────────────────
-- Usata da: TransportRepository.logEmail (Module Transport)
CREATE TABLE IF NOT EXISTS `email_logs` (
    `id`          INT             NOT NULL AUTO_INCREMENT,
    `event_id`    VARCHAR(20)     DEFAULT NULL,
    `recipient`   VARCHAR(255)    NOT NULL,
    `subject`     VARCHAR(255)    DEFAULT NULL,
    `type`        VARCHAR(50)     DEFAULT NULL COMMENT 'Es: CARPOOL_INVITE, REMINDER',
    `status`      ENUM('sent','failed','pending') NOT NULL DEFAULT 'pending',
    `sent_at`     DATETIME        DEFAULT NULL,
    `error_msg`   TEXT            DEFAULT NULL,
    `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_el_event` (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CHAT CHANNELS ───────────────────────────────────────────────────────────
-- Usata da: ChatController (Module Chat)
CREATE TABLE IF NOT EXISTS `chat_channels` (
    `id`          VARCHAR(20)     NOT NULL,
    `tenant_id`   VARCHAR(20)     NOT NULL,
    `team_id`     VARCHAR(20)     DEFAULT NULL,
    `name`        VARCHAR(100)    NOT NULL,
    `type`        ENUM('team','staff','parents','direct','general') NOT NULL DEFAULT 'general',
    `is_active`   TINYINT(1)      NOT NULL DEFAULT 1,
    `created_by`  VARCHAR(20)     DEFAULT NULL,
    `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ch_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CHAT CHANNEL MEMBERS ────────────────────────────────────────────────────
-- Usata da: ChatController (Module Chat)
CREATE TABLE IF NOT EXISTS `chat_channel_members` (
    `id`           INT             NOT NULL AUTO_INCREMENT,
    `channel_id`   VARCHAR(20)     NOT NULL,
    `user_id`      VARCHAR(20)     NOT NULL,
    `role`         ENUM('admin','member') NOT NULL DEFAULT 'member',
    `muted`        TINYINT(1)      NOT NULL DEFAULT 0,
    `last_read_at` DATETIME        DEFAULT NULL,
    `joined_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ccm` (`channel_id`, `user_id`),
    KEY `idx_ccm_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── AI SUMMARIES ────────────────────────────────────────────────────────────
-- Usata da: AthletesRepository.saveAiSummary / getLatestAiSummary
CREATE TABLE IF NOT EXISTS `ai_summaries` (
    `id`             VARCHAR(20)     NOT NULL,
    `athlete_id`     VARCHAR(20)     NOT NULL,
    `period_start`   DATE            DEFAULT NULL,
    `period_end`     DATE            DEFAULT NULL,
    `summary_text`   TEXT            NOT NULL,
    `model_version`  VARCHAR(50)     DEFAULT NULL,
    `created_at`     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_ais_athlete` (`athlete_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ACWR ALERTS ─────────────────────────────────────────────────────────────
-- Usata da: AthletesRepository.insertAcwrAlert / getUnacknowledgedAlerts
-- Usata da: DashboardController.stats (conteggio atleti a rischio)
CREATE TABLE IF NOT EXISTS `acwr_alerts` (
    `id`          INT             NOT NULL AUTO_INCREMENT,
    `athlete_id`  VARCHAR(20)     NOT NULL,
    `acwr_score`  DECIMAL(5,2)    NOT NULL,
    `risk_level`  ENUM('low','moderate','high','extreme') NOT NULL,
    `log_date`    DATE            NOT NULL,
    `ack_at`      DATETIME        DEFAULT NULL,
    `ack_by`      VARCHAR(20)     DEFAULT NULL,
    `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_acwr_athlete` (`athlete_id`),
    KEY `idx_acwr_date`    (`log_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CONTRACTS ───────────────────────────────────────────────────────────────
-- Usata da: AdminRepository (listContracts, createContract, updateContractPdf)
-- Usata da: DashboardController.deadlines (contratti in scadenza)
CREATE TABLE IF NOT EXISTS `contracts` (
    `id`               VARCHAR(20)     NOT NULL,
    `user_id`          VARCHAR(20)     NOT NULL,
    `type`             VARCHAR(50)     NOT NULL  COMMENT 'Es: COACH, STAFF, COLLABORATORE',
    `role_description` VARCHAR(255)    DEFAULT NULL,
    `valid_from`       DATE            DEFAULT NULL,
    `valid_to`         DATE            DEFAULT NULL,
    `monthly_fee_eur`  DECIMAL(10,2)   DEFAULT NULL,
    `pdf_path`         VARCHAR(500)    DEFAULT NULL,
    `status`           ENUM('draft','signed','expired','terminated') NOT NULL DEFAULT 'draft',
    `signed_at`        DATETIME        DEFAULT NULL,
    `created_by`       VARCHAR(20)     DEFAULT NULL,
    `deleted_at`       DATETIME        DEFAULT NULL,
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_con_user`    (`user_id`),
    KEY `idx_con_deleted` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
