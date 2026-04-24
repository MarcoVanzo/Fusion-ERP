-- V125: Fix athletes tenant_id mismatch
-- ROOT CAUSE: V028 backfilled athletes with 'TNT_default', but the system
-- now resolves to 'TNT_fusion' via TenantContext (DEFAULT_TENANT_ID env var).
-- This causes getAthleteById() to return NULL because the WHERE clause
-- filters by tenant_id = 'TNT_fusion' but the data has 'TNT_default'.
--
-- Additionally, createAthlete() never set tenant_id, so newly created
-- athletes have tenant_id = NULL and are also invisible.

-- 1. Fix legacy athletes with wrong tenant
UPDATE athletes SET tenant_id = 'TNT_fusion' WHERE tenant_id = 'TNT_default';

-- 2. Fix athletes with NULL tenant_id (created after V028 without tenant_id in INSERT)
UPDATE athletes SET tenant_id = 'TNT_fusion' WHERE tenant_id IS NULL;

-- 3. Set a safe DEFAULT so future inserts without explicit tenant_id still work
ALTER TABLE athletes MODIFY COLUMN tenant_id VARCHAR(20) NOT NULL DEFAULT 'TNT_fusion';
