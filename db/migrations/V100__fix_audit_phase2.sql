-- V100__fix_audit_phase2.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Audit Phase 2: Schema Reconciliation
--
-- Resolves:
--   P3: events.tenant_id missing from migrations (used by Finance, Dashboard, Tournaments)
--   P4: tournament_matches.match_time vs match_date column mismatch between V030 and V085
--   P5: event_attendees FK too strict for staff members
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
-- P3: events — add tenant_id (used by Finance, Dashboard, Tournaments)
-- This column was never declared in any migration but is referenced in 5+ modules.
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('events', 'tenant_id', "VARCHAR(20) DEFAULT NULL AFTER `id`");

-- Backfill: set tenant_id for existing events using the default tenant
UPDATE events
   SET tenant_id = COALESCE(
       (SELECT id FROM tenants WHERE is_active = 1 ORDER BY id LIMIT 1),
       'TNT_fusion'
   )
 WHERE tenant_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- P4: tournament_matches — ensure match_time column exists
-- V030 creates it correctly, but V085 has a competing CREATE TABLE IF NOT EXISTS
-- with match_date instead.  If V030 ran first, this is a no-op.
-- If V085 ran on a fresh DB, this adds the missing column.
-- ═══════════════════════════════════════════════════════════════════════════════
CALL safe_add_column('tournament_matches', 'match_time', "DATETIME NULL");
CALL safe_add_column('tournament_matches', 'opponent_name', "VARCHAR(150) NULL");
CALL safe_add_column('tournament_matches', 'court_name', "VARCHAR(100) NULL");
CALL safe_add_column('tournament_matches', 'our_score', "SMALLINT NULL DEFAULT 0");
CALL safe_add_column('tournament_matches', 'opponent_score', "SMALLINT NULL DEFAULT 0");

-- ═══════════════════════════════════════════════════════════════════════════════
-- P5: event_attendees — relax FK constraint for staff members
-- The current FK references athletes(id), but autoConvocate() also inserts
-- staff_members IDs. Drop the strict FK and keep the index for performance.
-- ═══════════════════════════════════════════════════════════════════════════════
-- Safe FK drop: check if the constraint exists before dropping
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'event_attendees'
  AND CONSTRAINT_NAME = 'fk_attendees_athlete';

SET @drop_fk = IF(@fk_exists > 0,
    'ALTER TABLE `event_attendees` DROP FOREIGN KEY `fk_attendees_athlete`',
    'SELECT 1');
PREPARE stmt FROM @drop_fk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ═══════════════════════════════════════════════════════════════════════════════
-- Add index on events.tenant_id for query performance
-- ═══════════════════════════════════════════════════════════════════════════════
SET @idx_exists = 0;
SELECT COUNT(*) INTO @idx_exists
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'events'
  AND INDEX_NAME = 'idx_events_tenant';

SET @add_idx = IF(@idx_exists = 0,
    'CREATE INDEX `idx_events_tenant` ON `events` (`tenant_id`)',
    'SELECT 1');
PREPARE stmt FROM @add_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ═══════════════════════════════════════════════════════════════════════════════
-- CLEANUP
-- ═══════════════════════════════════════════════════════════════════════════════
DROP PROCEDURE IF EXISTS safe_add_column;
