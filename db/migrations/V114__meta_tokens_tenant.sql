-- V114: Add tenant_id to meta_tokens and meta_oauth_states for multi-tenant isolation
-- Audit fix: P2-03 / P3-07

-- meta_tokens
SET @col_exists_1 = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meta_tokens' AND COLUMN_NAME = 'tenant_id');

SET @sql1 = IF(@col_exists_1 = 0,
    'ALTER TABLE meta_tokens ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '''' AFTER id',
    'SELECT 1');
PREPARE stmt1 FROM @sql1;
EXECUTE stmt1;
DEALLOCATE PREPARE stmt1;

-- meta_oauth_states
SET @col_exists_2 = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meta_oauth_states' AND COLUMN_NAME = 'tenant_id');

SET @sql2 = IF(@col_exists_2 = 0,
    'ALTER TABLE meta_oauth_states ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '''' AFTER token',
    'SELECT 1');
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- Populate from first tenant
UPDATE meta_tokens SET tenant_id = (
    SELECT id FROM tenants ORDER BY id LIMIT 1
) WHERE tenant_id = '' OR tenant_id IS NULL;

UPDATE meta_oauth_states SET tenant_id = (
    SELECT id FROM tenants ORDER BY id LIMIT 1
) WHERE tenant_id = '' OR tenant_id IS NULL;
