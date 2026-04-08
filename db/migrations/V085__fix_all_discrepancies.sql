-- V085__fix_all_discrepancies.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Comprehensive schema synchronization
-- Resolves all 97 discrepancies between PHP codebase and production DB.
--
-- Strategy: Uses a helper stored procedure to safely ADD COLUMN only when the
-- column does not already exist. This makes the entire script idempotent and
-- safe to run on any partial DB state (e.g., production where some migrations
-- were skipped or partially applied).
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Helper: safe_add_column ─────────────────────────────────────────────────
DROP PROCEDURE IF EXISTS safe_add_column;

DELIMITER //
CREATE PROCEDURE safe_add_column(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT
)
BEGIN
    -- First check if the TABLE exists at all
    SET @tbl_exists = 0;
    SELECT COUNT(*) INTO @tbl_exists
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table;

    IF @tbl_exists = 0 THEN
        -- Table doesn't exist yet; skip. CREATE TABLE IF NOT EXISTS will handle it.
        SET @col_exists = 1;
    ELSE
        SET @col_exists = 0;
        SELECT COUNT(*) INTO @col_exists
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = p_table
          AND COLUMN_NAME = p_column;
    END IF;

    IF @col_exists = 0 THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END //
DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. TENANTS MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('tenants', 'name', "VARCHAR(255) DEFAULT '' AFTER `id`");
CALL safe_add_column('tenants', 'is_active', "TINYINT(1) NOT NULL DEFAULT 1");
CALL safe_add_column('tenant_users', 'is_active', "TINYINT(1) NOT NULL DEFAULT 1");
CALL safe_add_column('tenant_invitations', 'invited_by', "VARCHAR(36) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. AUTH MODULE (users + login_attempts)
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('login_attempts', 'email', "VARCHAR(255) NULL");
CALL safe_add_column('users', 'email', "VARCHAR(255) NOT NULL DEFAULT '' AFTER `id`");
CALL safe_add_column('users', 'role', "VARCHAR(50) NOT NULL DEFAULT 'viewer'");
CALL safe_add_column('users', 'full_name', "VARCHAR(255) NOT NULL DEFAULT ''");
CALL safe_add_column('users', 'parent_user_id', "VARCHAR(36) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. ATHLETES MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('athletes', 'user_id', "VARCHAR(20) NULL");
CALL safe_add_column('athletes', 'team_id', "VARCHAR(20) NULL");
CALL safe_add_column('athletes', 'birth_date', "DATE NULL");
CALL safe_add_column('athletes', 'parent_phone', "VARCHAR(30) NULL");
CALL safe_add_column('athletes', 'privacy_policy_file_path', "VARCHAR(500) NULL");
CALL safe_add_column('athletes', 'guesthouse_rules_file_path', "VARCHAR(500) NULL");
CALL safe_add_column('athletes', 'guesthouse_delegate_file_path', "VARCHAR(500) NULL");
CALL safe_add_column('athletes', 'health_card_file_path', "VARCHAR(500) NULL");

-- metrics_logs table (ensure it exists first)
CREATE TABLE IF NOT EXISTS `metrics_logs` (
    `id`          VARCHAR(20)  NOT NULL,
    `tenant_id`   VARCHAR(20)  DEFAULT NULL,
    `athlete_id`  VARCHAR(20)  NOT NULL,
    `event_id`    VARCHAR(20)  NULL,
    `log_date`    DATE         NOT NULL,
    `rpe`         DECIMAL(3,1) NULL COMMENT 'Rate of Perceived Exertion (1-10)',
    `load_value`  DECIMAL(8,2) NULL COMMENT 'Training load value',
    `acwr_score`  DECIMAL(5,2) NULL COMMENT 'Acute:Chronic Workload Ratio',
    `notes`       TEXT         NULL,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_ml_athlete` (`athlete_id`),
    INDEX `idx_ml_date` (`log_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('metrics_logs', 'athlete_id', "VARCHAR(20) NOT NULL AFTER `tenant_id`");
CALL safe_add_column('metrics_logs', 'log_date', "DATE NOT NULL");
CALL safe_add_column('metrics_logs', 'rpe', "DECIMAL(3,1) NULL");
CALL safe_add_column('metrics_logs', 'load_value', "DECIMAL(8,2) NULL");
CALL safe_add_column('metrics_logs', 'acwr_score', "DECIMAL(5,2) NULL");
CALL safe_add_column('metrics_logs', 'notes', "TEXT NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. TRANSPORT MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('events', 'team_id', "VARCHAR(20) NULL");
CALL safe_add_column('events', 'title', "VARCHAR(200) NOT NULL DEFAULT ''");
CALL safe_add_column('events', 'created_by', "VARCHAR(20) NULL");
CALL safe_add_column('mileage_reimbursements', 'carpool_id', "VARCHAR(20) NULL");

-- Drivers table (ensure it exists first)
CREATE TABLE IF NOT EXISTS `drivers` (
    `id`           VARCHAR(20)  NOT NULL,
    `tenant_id`    VARCHAR(20)  DEFAULT NULL,
    `full_name`    VARCHAR(150) NOT NULL,
    `phone`        VARCHAR(30)  NULL,
    `license_type` VARCHAR(20)  NULL,
    `license_expiry` DATE      NULL,
    `hourly_rate`  DECIMAL(8,2) NULL,
    `status`       VARCHAR(30)  DEFAULT 'active',
    `notes`        TEXT         NULL,
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('drivers', 'full_name', "VARCHAR(150) NOT NULL DEFAULT ''");
CALL safe_add_column('drivers', 'hourly_rate', "DECIMAL(8,2) NULL");

-- Mileage reimbursements table (ensure it exists)
CREATE TABLE IF NOT EXISTS `mileage_reimbursements` (
    `id`           VARCHAR(20)  NOT NULL,
    `tenant_id`    VARCHAR(20)  DEFAULT NULL,
    `carpool_id`   VARCHAR(20)  NULL,
    `driver_id`    VARCHAR(20)  NULL,
    `event_id`     VARCHAR(20)  NULL,
    `distance_km`  DECIMAL(7,2) NULL,
    `amount_eur`   DECIMAL(8,2) NULL,
    `status`       VARCHAR(30)  DEFAULT 'pending',
    `notes`        TEXT         NULL,
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. HEALTH MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
-- injury_records table (ensure it exists first)
CREATE TABLE IF NOT EXISTS `injury_records` (
    `id`           VARCHAR(20)  NOT NULL,
    `tenant_id`    VARCHAR(20)  NOT NULL,
    `athlete_id`   VARCHAR(20)  NOT NULL,
    `injury_date`  DATE         NOT NULL,
    `body_part`    VARCHAR(100) NULL,
    `severity`     VARCHAR(50)  NULL,
    `stop_days`    INT          NULL,
    `description`  TEXT         NULL,
    `created_by`   VARCHAR(20)  NULL,
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_ir_athlete` (`athlete_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('injury_records', 'body_part', "VARCHAR(100) NULL");
CALL safe_add_column('injury_records', 'severity', "VARCHAR(50) NULL");
CALL safe_add_column('injury_records', 'stop_days', "INT NULL");
CALL safe_add_column('injury_records', 'created_by', "VARCHAR(20) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. NETWORK MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('network_collaborations', 'instagram', "VARCHAR(255) NULL");
CALL safe_add_column('network_collaborations', 'facebook', "VARCHAR(255) NULL");
CALL safe_add_column('network_collaborations', 'youtube', "VARCHAR(255) NULL");
CALL safe_add_column('network_collaborations', 'description', "TEXT NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 7. ADMIN MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
-- medical_certificates table (ensure it exists first)
CREATE TABLE IF NOT EXISTS `medical_certificates` (
    `id`                VARCHAR(20)  NOT NULL,
    `tenant_id`         VARCHAR(20)  NOT NULL,
    `athlete_id`        VARCHAR(20)  NOT NULL,
    `certificate_type`  VARCHAR(50)  DEFAULT 'competitive',
    `issue_date`        DATE         NULL,
    `expiry_date`       DATE         NULL,
    `file_path`         VARCHAR(500) NULL,
    `original_filename` VARCHAR(255) NULL,
    `notes`             TEXT         NULL,
    `created_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_mc_athlete` (`athlete_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('medical_certificates', 'athlete_id', "VARCHAR(20) NOT NULL AFTER `tenant_id`");
CALL safe_add_column('medical_certificates', 'file_path', "VARCHAR(500) NULL");
CALL safe_add_column('medical_certificates', 'original_filename', "VARCHAR(255) NULL");

-- backups table (ensure it exists first)
CREATE TABLE IF NOT EXISTS `backups` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id`        VARCHAR(20) NULL,
    `filename`         VARCHAR(255) NOT NULL,
    `tables_list`      TEXT NULL,
    `table_count`      INT DEFAULT 0,
    `file_size`        BIGINT DEFAULT 0,
    `created_by`       VARCHAR(20) NULL,
    `drive_uploaded_at` DATETIME NULL,
    `created_at`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('backups', 'filename', "VARCHAR(255) NOT NULL DEFAULT ''");
CALL safe_add_column('backups', 'tables_list', "TEXT NULL");
CALL safe_add_column('backups', 'table_count', "INT DEFAULT 0");
CALL safe_add_column('backups', 'created_by', "VARCHAR(20) NULL");
CALL safe_add_column('backups', 'drive_uploaded_at', "DATETIME NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 8. STAFF MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('staff_members', 'birth_date', "DATE NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 9. TASKS MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('tasks', 'attachment', "VARCHAR(500) NULL");

-- task_logs table (ensure it exists first)
CREATE TABLE IF NOT EXISTS `task_logs` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `task_id`    VARCHAR(20) NOT NULL,
    `user_id`    VARCHAR(20) NULL,
    `action`     VARCHAR(100) NULL,
    `esito`      VARCHAR(100) NULL,
    `attachment` VARCHAR(500) NULL,
    `notes`      TEXT NULL,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('task_logs', 'esito', "VARCHAR(100) NULL");
CALL safe_add_column('task_logs', 'attachment', "VARCHAR(500) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 10. PAYMENTS MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('payment_plans', 'status', "VARCHAR(30) DEFAULT 'active'");
CALL safe_add_column('payment_plans', 'notes', "TEXT NULL");
CALL safe_add_column('transactions', 'created_by', "VARCHAR(20) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 11. SCOUTING MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('scouting_athletes', 'cognito_form', "VARCHAR(50) NULL");
CALL safe_add_column('scouting_athletes', 'synced_at', "TIMESTAMP NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 12. RESULTS MODULE (Federation Championships + Matches)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `federation_championships` (
    `id`             VARCHAR(20)  NOT NULL,
    `tenant_id`      VARCHAR(20)  NOT NULL,
    `name`           VARCHAR(255) NOT NULL,
    `federation`     VARCHAR(50)  NULL,
    `season`         VARCHAR(10)  NULL,
    `standings_url`  VARCHAR(500) NULL,
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('federation_championships', 'standings_url', "VARCHAR(500) NULL");

CREATE TABLE IF NOT EXISTS `federation_matches` (
    `id`              VARCHAR(20)  NOT NULL,
    `championship_id` VARCHAR(20)  NOT NULL,
    `match_date`      DATETIME     NULL,
    `home_team`       VARCHAR(150) NULL,
    `away_team`       VARCHAR(150) NULL,
    `home_logo`       VARCHAR(500) NULL,
    `away_logo`       VARCHAR(500) NULL,
    `home_score`      INT          NULL,
    `away_score`      INT          NULL,
    `status`          VARCHAR(30)  DEFAULT 'scheduled',
    `round`           VARCHAR(50)  NULL,
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('federation_matches', 'away_logo', "VARCHAR(500) NULL");
CALL safe_add_column('federation_matches', 'status', "VARCHAR(30) DEFAULT 'scheduled'");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 13. FEDERATION MODULE (Cards + RASD)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `federation_cards` (
    `id`             VARCHAR(20)  NOT NULL,
    `tenant_id`      VARCHAR(20)  NOT NULL,
    `athlete_id`     VARCHAR(20)  NOT NULL,
    `federation`     VARCHAR(50)  NOT NULL,
    `card_number`    VARCHAR(50)  NULL,
    `season`         VARCHAR(10)  NOT NULL,
    `card_type`      VARCHAR(30)  NOT NULL DEFAULT 'atleta',
    `status`         VARCHAR(30)  NOT NULL DEFAULT 'pending',
    `requested_at`   DATE         NULL,
    `issued_at`      DATE         NULL,
    `expires_at`     DATE         NULL,
    `fee_amount`     DECIMAL(8,2) NULL,
    `fee_paid`       TINYINT(1)   NOT NULL DEFAULT 0,
    `notes`          TEXT         NULL,
    `created_by`     VARCHAR(20)  NULL,
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_fc_tenant` (`tenant_id`),
    INDEX `idx_fc_athlete` (`athlete_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('federation_cards', 'federation', "VARCHAR(50) NOT NULL DEFAULT ''");
CALL safe_add_column('federation_cards', 'card_number', "VARCHAR(50) NULL");
CALL safe_add_column('federation_cards', 'card_type', "VARCHAR(30) NOT NULL DEFAULT 'atleta'");
CALL safe_add_column('federation_cards', 'status', "VARCHAR(30) NOT NULL DEFAULT 'pending'");
CALL safe_add_column('federation_cards', 'requested_at', "DATE NULL");

CREATE TABLE IF NOT EXISTS `rasd_registrations` (
    `id`                    VARCHAR(20)  NOT NULL,
    `tenant_id`             VARCHAR(20)  NOT NULL,
    `rasd_code`             VARCHAR(50)  NULL,
    `registration_date`     DATE         NULL,
    `status`                VARCHAR(30)  NOT NULL DEFAULT 'active',
    `sport_type`            VARCHAR(100) NOT NULL DEFAULT '',
    `legal_form`            VARCHAR(50)  NOT NULL DEFAULT '',
    `affiliated_federation` VARCHAR(50)  NULL,
    `affiliation_number`    VARCHAR(50)  NULL,
    `last_renewal`          DATE         NULL,
    `next_renewal`          DATE         NULL,
    `notes`                 TEXT         NULL,
    `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('rasd_registrations', 'registration_date', "DATE NULL");
CALL safe_add_column('rasd_registrations', 'sport_type', "VARCHAR(100) NOT NULL DEFAULT ''");
CALL safe_add_column('rasd_registrations', 'affiliated_federation', "VARCHAR(50) NULL");
CALL safe_add_column('rasd_registrations', 'affiliation_number', "VARCHAR(50) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 14. TEAMS MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('teams', 'category', "VARCHAR(30) NOT NULL DEFAULT ''");
CALL safe_add_column('teams', 'color_hex', "VARCHAR(7) NULL DEFAULT '#E6007E'");

CREATE TABLE IF NOT EXISTS `team_seasons` (
    `id`         VARCHAR(20) NOT NULL,
    `team_id`    VARCHAR(20) NOT NULL,
    `season`     VARCHAR(10) NOT NULL,
    `is_active`  TINYINT(1)  NOT NULL DEFAULT 1,
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ts_team_season` (`team_id`, `season`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('team_seasons', 'team_id', "VARCHAR(20) NOT NULL AFTER `id`");
CALL safe_add_column('team_seasons', 'season', "VARCHAR(10) NOT NULL AFTER `team_id`");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 15. VEHICLES MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id`            VARCHAR(20)  NOT NULL,
    `name`          VARCHAR(255) NOT NULL DEFAULT '',
    `license_plate` VARCHAR(20)  NULL,
    `capacity`      INT          DEFAULT 9,
    `status`        VARCHAR(30)  DEFAULT 'active',
    `notes`         TEXT         NULL,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `vehicle_maintenance` (
    `id`                       VARCHAR(20) NOT NULL,
    `vehicle_id`               VARCHAR(20) NOT NULL,
    `maintenance_date`         DATE        NOT NULL,
    `type`                     VARCHAR(50) NOT NULL DEFAULT 'altro',
    `description`              TEXT        NULL,
    `cost`                     DECIMAL(10,2) DEFAULT 0.00,
    `mileage`                  INT         NULL,
    `next_maintenance_date`    DATE        NULL,
    `next_maintenance_mileage` INT         NULL,
    `created_at`               DATETIME    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`               DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('vehicle_maintenance', 'next_maintenance_date', "DATE NULL");

CREATE TABLE IF NOT EXISTS `vehicle_anomalies` (
    `id`               VARCHAR(20) NOT NULL,
    `vehicle_id`       VARCHAR(20) NOT NULL,
    `report_date`      DATETIME    DEFAULT CURRENT_TIMESTAMP,
    `reporter_id`      VARCHAR(36) NULL,
    `description`      TEXT        NOT NULL,
    `severity`         VARCHAR(20) DEFAULT 'medium',
    `status`           VARCHAR(20) DEFAULT 'open',
    `resolution_notes` TEXT        NULL,
    `resolved_date`    DATETIME    NULL,
    `created_at`       DATETIME    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`       DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('vehicle_anomalies', 'description', "TEXT NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 16. FINANCE MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('journal_entries', 'entry_date', "DATE NULL");
CALL safe_add_column('journal_entries', 'category', "VARCHAR(100) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 17. SOCIETA MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('societa_companies', 'facebook', "VARCHAR(255) NULL");
CALL safe_add_column('societa_companies', 'instagram', "VARCHAR(255) NULL");
CALL safe_add_column('societa_companies', 'description', "TEXT NULL");

CALL safe_add_column('societa_sponsors', 'tipo', "VARCHAR(100) NULL");
CALL safe_add_column('societa_sponsors', 'importo', "DECIMAL(10,2) NULL");
CALL safe_add_column('societa_sponsors', 'rapporto', "TEXT NULL");
CALL safe_add_column('societa_sponsors', 'sponsorizzazione', "TEXT NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 18. WHATSAPP MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `whatsapp_messages` (
    `id`            VARCHAR(40)     NOT NULL,
    `wa_message_id` VARCHAR(100)    NOT NULL,
    `from_phone`    VARCHAR(30)     NOT NULL,
    `message_type`  VARCHAR(30)     NOT NULL DEFAULT 'text',
    `body`          TEXT            NULL,
    `media_id`      VARCHAR(100)    NULL,
    `timestamp`     BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `status`        VARCHAR(30)     NOT NULL DEFAULT 'received',
    `athlete_id`    VARCHAR(40)     NULL,
    `tenant_id`     VARCHAR(40)     NOT NULL DEFAULT 'TNT_default',
    `created_at`    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('whatsapp_messages', 'timestamp', "BIGINT UNSIGNED NOT NULL DEFAULT 0");
CALL safe_add_column('whatsapp_messages', 'status', "VARCHAR(30) NOT NULL DEFAULT 'received'");
CALL safe_add_column('whatsapp_messages', 'tenant_id', "VARCHAR(40) NOT NULL DEFAULT 'TNT_default'");
CALL safe_add_column('whatsapp_messages', 'media_id', "VARCHAR(100) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 19. OUTSEASON MODULE
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `outseason_entries` (
    `id`                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `cognito_id`           INT UNSIGNED NOT NULL,
    `season_key`           VARCHAR(10)  NOT NULL,
    `nome_e_cognome`       VARCHAR(200) NOT NULL DEFAULT '',
    `email`                VARCHAR(200) NULL,
    `cellulare`            VARCHAR(50)  NULL,
    `codice_fiscale`       VARCHAR(20)  NULL,
    `data_di_nascita`      DATE         NULL,
    `indirizzo`            VARCHAR(255) NULL,
    `cap`                  VARCHAR(10)  NULL,
    `citta`                VARCHAR(100) NULL,
    `provincia`            VARCHAR(50)  NULL,
    `club_di_appartenenza` VARCHAR(200) NULL,
    `ruolo`                VARCHAR(50)  NULL,
    `taglia_kit`           VARCHAR(10)  NULL,
    `settimana_scelta`     VARCHAR(100) NULL,
    `formula_scelta`       VARCHAR(200) NULL,
    `come_vuoi_pagare`     VARCHAR(100) NULL,
    `codice_sconto`        VARCHAR(50)  NULL,
    `entry_date`           DATETIME     NULL,
    `entry_status`         VARCHAR(50)  NULL,
    `order_summary`        VARCHAR(200) NULL,
    `synced_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_cognito_season` (`cognito_id`, `season_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('outseason_entries', 'nome_e_cognome', "VARCHAR(200) NOT NULL DEFAULT ''");
CALL safe_add_column('outseason_entries', 'club_di_appartenenza', "VARCHAR(200) NULL");
CALL safe_add_column('outseason_entries', 'settimana_scelta', "VARCHAR(100) NULL");
CALL safe_add_column('outseason_entries', 'synced_at', "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 20. ECOMMERCE MODULE (ec_products — ensure table exists)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `ec_products` (
    `id`               INT AUTO_INCREMENT PRIMARY KEY,
    `nome`             VARCHAR(255) NOT NULL,
    `prezzo`           DECIMAL(10,2) DEFAULT 0.00,
    `categoria`        VARCHAR(100) NULL,
    `descrizione`      TEXT NULL,
    `immagineBase64`   LONGTEXT NULL,
    `immagineMimeType` VARCHAR(50) NULL,
    `immagineUrl`      VARCHAR(500) NULL,
    `disponibile`      TINYINT(1) DEFAULT 1,
    `importatoIl`      DATETIME NULL,
    `modificatoIl`     DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 21. TOURNAMENT MODULE (tournament_matches → event_id)
-- ═══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS `tournament_matches` (
    `id`             VARCHAR(20) NOT NULL,
    `tournament_id`  VARCHAR(20) NOT NULL,
    `event_id`       VARCHAR(20) NULL,
    `round`          VARCHAR(50) NULL,
    `home_team`      VARCHAR(150) NULL,
    `away_team`      VARCHAR(150) NULL,
    `home_score`     INT NULL,
    `away_score`     INT NULL,
    `match_date`     DATETIME NULL,
    `status`         VARCHAR(30) DEFAULT 'scheduled',
    `created_at`     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CALL safe_add_column('tournament_matches', 'event_id', "VARCHAR(20) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- CLEANUP: Drop helper procedure
-- ═══════════════════════════════════════════════════════════════════════════════
DROP PROCEDURE IF EXISTS safe_add_column;
