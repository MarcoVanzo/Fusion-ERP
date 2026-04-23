-- V119: Add tenant_id to ai_summaries and acwr_alerts tables.
-- These tables were missing tenant isolation, causing INSERT failures
-- after the security audit added tenant_id to repository methods.
-- Uses the idempotent safe_add_column procedure from V085.

-- ─── AI SUMMARIES ──────────────────────────────────────────────────────────
-- Check and add tenant_id column (nullable for backwards compatibility with existing rows)
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_summaries' AND COLUMN_NAME = 'tenant_id');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE ai_summaries ADD COLUMN tenant_id VARCHAR(50) DEFAULT NULL AFTER id', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill existing rows with default tenant
UPDATE ai_summaries SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL;

-- Index for tenant-scoped queries
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ai_summaries' AND INDEX_NAME = 'idx_ai_summaries_tenant');

SET @sql = IF(@idx_exists = 0, 
    'CREATE INDEX idx_ai_summaries_tenant ON ai_summaries(tenant_id)', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- ─── ACWR ALERTS ───────────────────────────────────────────────────────────
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'acwr_alerts' AND COLUMN_NAME = 'tenant_id');

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE acwr_alerts ADD COLUMN tenant_id VARCHAR(50) DEFAULT NULL AFTER id', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill: derive tenant_id from associated athlete
UPDATE acwr_alerts aa
JOIN athletes a ON a.id = aa.athlete_id
SET aa.tenant_id = a.tenant_id
WHERE aa.tenant_id IS NULL;

-- Fallback for orphaned alerts
UPDATE acwr_alerts SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL;

SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'acwr_alerts' AND INDEX_NAME = 'idx_acwr_alerts_tenant');

SET @sql = IF(@idx_exists = 0, 
    'CREATE INDEX idx_acwr_alerts_tenant ON acwr_alerts(tenant_id)', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
