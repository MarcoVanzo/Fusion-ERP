-- V113: Fix outseason_entries and outseason_verifications tenant_id to NOT NULL
-- Audit fix: P3-05

-- 1. Add tenant_id if it doesn't exist (outseason_entries)
SET @col_exists_e = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND COLUMN_NAME = 'tenant_id');
SET @sql_e = IF(@col_exists_e = 0,
    'ALTER TABLE outseason_entries ADD COLUMN tenant_id VARCHAR(36) DEFAULT NULL AFTER id',
    'SELECT 1');
PREPARE stmt_e FROM @sql_e;
EXECUTE stmt_e;
DEALLOCATE PREPARE stmt_e;

-- 2. Add tenant_id if it doesn't exist (outseason_verifications)
SET @col_exists_v = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_verifications' AND COLUMN_NAME = 'tenant_id');
SET @sql_v = IF(@col_exists_v = 0,
    'ALTER TABLE outseason_verifications ADD COLUMN tenant_id VARCHAR(36) DEFAULT NULL AFTER id',
    'SELECT 1');
PREPARE stmt_v FROM @sql_v;
EXECUTE stmt_v;
DEALLOCATE PREPARE stmt_v;

-- 3. Populate NULL tenant_id values from the first tenant
UPDATE outseason_entries SET tenant_id = (
    SELECT id FROM tenants ORDER BY id LIMIT 1
) WHERE tenant_id IS NULL OR tenant_id = '';

UPDATE outseason_verifications SET tenant_id = (
    SELECT id FROM tenants ORDER BY id LIMIT 1
) WHERE tenant_id IS NULL OR tenant_id = '';

-- 4. Make NOT NULL with safe default
ALTER TABLE outseason_entries MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '';
ALTER TABLE outseason_verifications MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '';

-- 5. Add indexes if they don't exist
SET @idx_exists_e = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND INDEX_NAME = 'idx_outseason_entries_tenant');
SET @sql_idx_e = IF(@idx_exists_e = 0,
    'CREATE INDEX idx_outseason_entries_tenant ON outseason_entries(tenant_id, season_key)',
    'SELECT 1');
PREPARE stmt_idx_e FROM @sql_idx_e;
EXECUTE stmt_idx_e;
DEALLOCATE PREPARE stmt_idx_e;

SET @idx_exists_v = (SELECT COUNT(*) FROM information_schema.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_verifications' AND INDEX_NAME = 'idx_outseason_verifications_tenant');
SET @sql_idx_v = IF(@idx_exists_v = 0,
    'CREATE INDEX idx_outseason_verifications_tenant ON outseason_verifications(tenant_id, season_key)',
    'SELECT 1');
PREPARE stmt_idx_v FROM @sql_idx_v;
EXECUTE stmt_idx_v;
DEALLOCATE PREPARE stmt_idx_v;
