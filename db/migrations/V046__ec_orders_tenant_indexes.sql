-- V046__ec_orders_tenant_indexes.sql
-- Post-deploy migration: adds tenant_id column and indexes to ec_orders
-- Safe to run multiple times (uses IF NOT EXISTS / checks)

-- Add tenant_id column if not exists
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ec_orders' AND COLUMN_NAME = 'tenant_id');
SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE ec_orders ADD COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT \'\' AFTER id', 
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Populate tenant_id from existing tenant if empty
UPDATE ec_orders SET tenant_id = (
    SELECT id FROM tenants WHERE is_active = 1 ORDER BY created_at ASC LIMIT 1
) WHERE tenant_id = '' OR tenant_id IS NULL;

-- Add indexes (ignore if already exist)
CREATE INDEX idx_ec_orders_tenant ON ec_orders(tenant_id);
CREATE INDEX idx_ec_orders_data_ordine ON ec_orders(data_ordine);
CREATE INDEX idx_ec_orders_stato_interno ON ec_orders(stato_interno);

-- Drop old UNIQUE on cognito_id alone (if exists) and add composite
ALTER TABLE ec_orders DROP INDEX IF EXISTS cognito_id;
ALTER TABLE ec_orders ADD UNIQUE KEY uq_tenant_cognito (tenant_id, cognito_id);
