-- V102: Add tenant_id to teams for multi-tenant isolation
-- Part of P1-04 security hardening
-- Idempotent: uses DROP/CREATE PROCEDURE pattern for MySQL DDL safety

DELIMITER //
CREATE PROCEDURE _migration_v102()
BEGIN
    -- 1. Add tenant_id to teams if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND COLUMN_NAME = 'tenant_id'
    ) THEN
        ALTER TABLE `teams` ADD COLUMN `tenant_id` VARCHAR(20) DEFAULT 'TNT_fusion' AFTER `id`;
        
        -- Backfill existing teams
        UPDATE `teams` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL;
    END IF;

    -- 2. Add index if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'teams' AND INDEX_NAME = 'idx_teams_tenant'
    ) THEN
        ALTER TABLE `teams` ADD INDEX `idx_teams_tenant` (`tenant_id`);
    END IF;
END//
DELIMITER ;

CALL _migration_v102();
DROP PROCEDURE IF EXISTS _migration_v102;
