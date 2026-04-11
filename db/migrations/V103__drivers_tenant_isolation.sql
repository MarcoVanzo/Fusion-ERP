-- V103: Backfill tenant_id for drivers
-- Part of P8 multi-tenant isolation bug fix
-- Idempotent: uses DROP/CREATE PROCEDURE pattern for MySQL DDL safety

DELIMITER //
CREATE PROCEDURE _migration_v103()
BEGIN
    -- 1. Add tenant_id to drivers if not exists (should be added by V096, but safe to check)
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drivers' AND COLUMN_NAME = 'tenant_id'
    ) THEN
        ALTER TABLE `drivers` ADD COLUMN `tenant_id` VARCHAR(20) DEFAULT 'TNT_fusion' AFTER `id`;
    END IF;

    -- Backfill existing drivers
    UPDATE `drivers` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL;

    -- 2. Add index if not exists to speed up query
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'drivers' AND INDEX_NAME = 'idx_drivers_tenant'
    ) THEN
        ALTER TABLE `drivers` ADD INDEX `idx_drivers_tenant` (`tenant_id`);
    END IF;
END//
DELIMITER ;

CALL _migration_v103();
DROP PROCEDURE IF EXISTS _migration_v103;
