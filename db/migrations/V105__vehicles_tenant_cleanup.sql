-- V105__vehicles_tenant_cleanup.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Transport & Vehicles Multi-Tenant Hardening
--
-- This migration ensures ALL transport-related tables have tenant_id columns
-- and are correctly consolidated to 'TNT_fusion'.
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Helper: safe_add_column_with_index (idempotent)
DROP PROCEDURE IF EXISTS _safe_add_column_v105;
DELIMITER //
CREATE PROCEDURE _safe_add_column_v105(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_definition TEXT,
    IN p_index_name VARCHAR(64)
)
BEGIN
    -- Add column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND COLUMN_NAME = p_column
    ) THEN
        SET @ddl = CONCAT('ALTER TABLE `', p_table, '` ADD COLUMN `', p_column, '` ', p_definition);
        PREPARE stmt FROM @ddl;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;

    -- Add index if not exists (and if name provided)
    IF p_index_name IS NOT NULL AND p_index_name != '' THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.STATISTICS 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_table AND INDEX_NAME = p_index_name
        ) THEN
            SET @ddl_idx = CONCAT('ALTER TABLE `', p_table, '` ADD INDEX `', p_index_name, '` (`', p_column, '`)');
            PREPARE stmt_idx FROM @ddl_idx;
            EXECUTE stmt_idx;
            DEALLOCATE PREPARE stmt_idx;
        END IF;
    END IF;
END //
DELIMITER ;

-- 2. Add tenant_id to missing Transport tables
CALL _safe_add_column_v105('events', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id` ", 'idx_events_tenant');
CALL _safe_add_column_v105('gyms', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id` ", 'idx_gyms_tenant');
CALL _safe_add_column_v105('carpool_routes', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id` ", 'idx_carpool_tenant');
CALL _safe_add_column_v105('carpool_passengers', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id` ", 'idx_passengers_tenant');
CALL _safe_add_column_v105('mileage_reimbursements', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id` ", 'idx_reimbursements_tenant');
-- Note: 'transports' table is already joining with 'teams', but adding it for consistency
CALL _safe_add_column_v105('transports', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id` ", 'idx_transports_tenant');

-- 3. Consolidate ALL Vehicle & Transport records to TNT_fusion
UPDATE `vehicles` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `vehicle_maintenance` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `vehicle_anomalies` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `drivers` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `events` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `gyms` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `carpool_routes` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `carpool_passengers` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `mileage_reimbursements` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';
UPDATE `transports` SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL OR tenant_id = 'TNT_default';

-- 4. Cleanup
DROP PROCEDURE IF EXISTS _safe_add_column_v105;
