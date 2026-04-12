-- V113: Fix outseason_entries and outseason_verifications tenant_id to NOT NULL
-- Audit fix: P3-05

-- Populate NULL tenant_id values from the first tenant
UPDATE outseason_entries SET tenant_id = (
    SELECT id FROM tenants ORDER BY id LIMIT 1
) WHERE tenant_id IS NULL OR tenant_id = '';

UPDATE outseason_verifications SET tenant_id = (
    SELECT id FROM tenants ORDER BY id LIMIT 1
) WHERE tenant_id IS NULL OR tenant_id = '';

-- Make NOT NULL with safe default
ALTER TABLE outseason_entries MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '';
ALTER TABLE outseason_verifications MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL DEFAULT '';

-- Add indexes if not exist
CREATE INDEX idx_outseason_entries_tenant ON outseason_entries(tenant_id, season_key);
CREATE INDEX idx_outseason_verifications_tenant ON outseason_verifications(tenant_id, season_key);
