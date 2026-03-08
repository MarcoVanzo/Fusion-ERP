-- ============================================================
-- V039 — Performance indexes on audit_logs
-- ============================================================
-- Problem: getActivityLog() AthletesRepository uses
--   JSON_UNQUOTE(JSON_EXTRACT(after_snapshot, '$.athlete_id'))
-- on audit_logs, which requires a full table scan as MySQL
-- cannot use an index on a JSON expression without a
-- generated column.
--
-- Fix: add a generated indexed column `entity_id` that stores
-- the athlete_id (or the relevant entity FK) at insert time,
-- populated from JSON where record_id is not sufficient.
-- This uses a virtual generated column (no storage overhead).
-- ============================================================

-- 1. Index on (table_name, record_id) — covers the "anagrafica" query
--    and future lookups by record type + id.
ALTER TABLE audit_logs
    ADD INDEX IF NOT EXISTS idx_audit_table_record (table_name, record_id);

-- 2. Generated column from JSON payload → enables indexed lookups
--    for metrics, pagamenti, documenti sections.
--    Uses VIRTUAL (computed on read, not stored) to avoid extra disk usage.
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS `json_entity_id` VARCHAR(32)
        GENERATED ALWAYS AS (
            JSON_UNQUOTE(
                COALESCE(
                    JSON_EXTRACT(after_snapshot,  '$.athlete_id'),
                    JSON_EXTRACT(before_snapshot, '$.athlete_id')
                )
            )
        ) VIRTUAL;

-- 3. Index on the generated column so JSON_EXTRACT lookups become fast.
ALTER TABLE audit_logs
    ADD INDEX IF NOT EXISTS idx_audit_json_entity (json_entity_id, table_name);

-- 4. Composite index on (table_name, created_at DESC) to speed up
--    ORDER BY created_at DESC LIMIT 5 queries.
ALTER TABLE audit_logs
    ADD INDEX IF NOT EXISTS idx_audit_table_date (table_name, created_at DESC);
