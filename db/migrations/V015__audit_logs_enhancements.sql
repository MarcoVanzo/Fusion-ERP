-- V015__audit_logs_enhancements.sql
-- Adds event_type, username, user_agent, http_status, details to audit_logs
-- Compatible with MySQL 5.7+ (uses PROCEDURE + INFORMATION_SCHEMA checks)

DROP PROCEDURE IF EXISTS fusion_migrate_v015;

DELIMITER $$
CREATE PROCEDURE fusion_migrate_v015()
BEGIN
    -- ─── Add event_type ────────────────────────────────────────────────────────
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'event_type'
    ) THEN
        ALTER TABLE audit_logs
            ADD COLUMN event_type VARCHAR(30) NOT NULL DEFAULT 'crud'
                COMMENT 'login | logout | crud | backup | restore | error | access_denied | system'
                AFTER action;
    END IF;

    -- ─── Add username (snapshot) ───────────────────────────────────────────────
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'username'
    ) THEN
        ALTER TABLE audit_logs
            ADD COLUMN username VARCHAR(150) NULL
                AFTER user_id;
    END IF;

    -- ─── Add user_agent ────────────────────────────────────────────────────────
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'user_agent'
    ) THEN
        ALTER TABLE audit_logs
            ADD COLUMN user_agent VARCHAR(512) NULL
                AFTER ip_address;
    END IF;

    -- ─── Add http_status ───────────────────────────────────────────────────────
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'http_status'
    ) THEN
        ALTER TABLE audit_logs
            ADD COLUMN http_status SMALLINT NULL DEFAULT 200
                AFTER user_agent;
    END IF;

    -- ─── Add details ───────────────────────────────────────────────────────────
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND COLUMN_NAME = 'details'
    ) THEN
        ALTER TABLE audit_logs
            ADD COLUMN details TEXT NULL
                AFTER http_status;
    END IF;

    -- ─── Index on event_type ───────────────────────────────────────────────────
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'audit_logs' AND INDEX_NAME = 'idx_audit_event_type'
    ) THEN
        ALTER TABLE audit_logs
            ADD INDEX idx_audit_event_type (event_type);
    END IF;
END$$
DELIMITER ;

CALL fusion_migrate_v015();
DROP PROCEDURE IF EXISTS fusion_migrate_v015;
