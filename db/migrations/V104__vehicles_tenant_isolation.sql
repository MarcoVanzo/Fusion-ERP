-- V104: Vehicles module tenant isolation and backfill
-- Enforces multi-tenant isolation for vehicles, maintenance, and anomalies tables.

DELIMITER //

CREATE PROCEDURE _migration_v104()
BEGIN
    -- 1. Ensure vehicles.tenant_id is backfilled (column added in V096)
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND COLUMN_NAME = 'tenant_id'
    ) THEN
        UPDATE `vehicles` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = '';
        
        -- Add index if not exists
        IF NOT EXISTS (
            SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicles' AND INDEX_NAME = 'idx_vehicles_tenant'
        ) THEN
            ALTER TABLE `vehicles` ADD INDEX `idx_vehicles_tenant` (`tenant_id`);
        END IF;
    END IF;

    -- 2. Add tenant_id to vehicle_maintenance
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_maintenance' AND COLUMN_NAME = 'tenant_id'
    ) THEN
        ALTER TABLE `vehicle_maintenance` ADD COLUMN `tenant_id` VARCHAR(20) DEFAULT 'TNT_fusion' AFTER `id`;
        ALTER TABLE `vehicle_maintenance` ADD INDEX `idx_vehicle_maint_tenant` (`tenant_id`);
    ELSE
        UPDATE `vehicle_maintenance` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = '';
    END IF;

    -- 3. Add tenant_id to vehicle_anomalies
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vehicle_anomalies' AND COLUMN_NAME = 'tenant_id'
    ) THEN
        ALTER TABLE `vehicle_anomalies` ADD COLUMN `tenant_id` VARCHAR(20) DEFAULT 'TNT_fusion' AFTER `id`;
        ALTER TABLE `vehicle_anomalies` ADD INDEX `idx_vehicle_anom_tenant` (`tenant_id`);
    ELSE
        UPDATE `vehicle_anomalies` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = '';
    END IF;

END//

DELIMITER ;

CALL _migration_v104();
DROP PROCEDURE IF EXISTS _migration_v104;
