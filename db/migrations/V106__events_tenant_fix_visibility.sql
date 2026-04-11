-- V106__events_tenant_fix_visibility.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Fix tournament visibility issues by standardizing tenant_id.
--
-- This script ensures that any 'orphan' tournaments (with NULL or mismatching
-- tenant_id) are associated with a valid active tenant (prioritizing TNT_fusion).
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
-- 1. Ensure events.tenant_id exists (idempotency safety)
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('events', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id`");

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Standardize Tenant association for Tournaments
-- ═══════════════════════════════════════════════════════════════════════════════
-- If there are events of type 'tournament' that are not visible because they
-- have a tenant_id that doesn't correspond to the main one, we force them
-- to TNT_fusion (the system default).

SET @default_tid = 'TNT_fusion';

-- Update all tournaments to the default tenant if they have no tenant or 
-- if they were wrongly assigned to a legacy/null tenant during previous migrations.
UPDATE events
   SET tenant_id = @default_tid
 WHERE type = 'tournament'
   AND (tenant_id IS NULL OR tenant_id = '');

-- Safety: Ensure at least one tenant exists for joining in repositories
INSERT IGNORE INTO tenants (id, name, is_active) VALUES ('TNT_fusion', 'Fusion ERP Default', 1);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. Maintenance: Ensure tournament_details exist
-- ═══════════════════════════════════════════════════════════════════════════════
-- The repository uses LEFT JOIN, but having details ensures UI features work correctly.
INSERT IGNORE INTO tournament_details (event_id, fee_per_athlete)
SELECT id, 0.00
FROM events
WHERE type = 'tournament'
  AND id NOT IN (SELECT event_id FROM tournament_details);

-- Clean up
DROP PROCEDURE IF EXISTS safe_add_column;
