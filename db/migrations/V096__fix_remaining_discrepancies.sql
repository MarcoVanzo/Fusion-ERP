-- V086__fix_remaining_discrepancies.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Fix remaining schema discrepancies not covered by V085.
--
-- Resolves:
--   P3: metrics_logs.duration_min missing from V085 CREATE TABLE
--   P4: drivers missing is_active, deleted_at, created_by, license_number
--   P8: drivers missing tenant_id for multi-tenant isolation
--   P9: vehicles missing insurance_expiry, road_tax_expiry
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
    SET @tbl_exists = 0;
    SELECT COUNT(*) INTO @tbl_exists
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table;

    IF @tbl_exists = 0 THEN
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
-- P3: metrics_logs — add duration_min (used by AthletesRepository::insertMetric)
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('metrics_logs', 'duration_min', "SMALLINT NOT NULL DEFAULT 0 AFTER `log_date`");
CALL safe_add_column('metrics_logs', 'event_id', "VARCHAR(20) NULL AFTER `athlete_id`");
CALL safe_add_column('metrics_logs', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id`");

-- ═══════════════════════════════════════════════════════════════════════════════
-- P4: drivers — add columns used by TransportRepository but missing from V085
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('drivers', 'is_active', "TINYINT(1) NOT NULL DEFAULT 1");
CALL safe_add_column('drivers', 'deleted_at', "DATETIME NULL");
CALL safe_add_column('drivers', 'created_by', "VARCHAR(20) NULL");
CALL safe_add_column('drivers', 'license_number', "VARCHAR(50) NULL");

-- ═══════════════════════════════════════════════════════════════════════════════
-- P8: drivers — add tenant_id for multi-tenant isolation
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('drivers', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id`");

-- ═══════════════════════════════════════════════════════════════════════════════
-- P9: vehicles — add insurance_expiry and road_tax_expiry
--     (present in V033 CREATE but not in V085 CREATE TABLE IF NOT EXISTS)
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('vehicles', 'insurance_expiry', "DATE NULL");
CALL safe_add_column('vehicles', 'road_tax_expiry', "DATE NULL");
CALL safe_add_column('vehicles', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id`");

-- ═══════════════════════════════════════════════════════════════════════════════
-- CLEANUP
-- ═══════════════════════════════════════════════════════════════════════════════
DROP PROCEDURE IF EXISTS safe_add_column;
