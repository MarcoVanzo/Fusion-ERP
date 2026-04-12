-- V112: Add tenant_id column to ec_products for multi-tenant isolation
-- Audit fix: P2-06 / P3-06

-- Add tenant_id column if not exists
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ec_products' AND COLUMN_NAME = 'tenant_id');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE ec_products ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '''' AFTER id',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate tenant_id from the first tenant if empty
UPDATE ec_products SET tenant_id = (
    SELECT id FROM tenants ORDER BY id LIMIT 1
) WHERE tenant_id = '' OR tenant_id IS NULL;

-- Add index for tenant queries
CREATE INDEX idx_ec_products_tenant ON ec_products(tenant_id);
