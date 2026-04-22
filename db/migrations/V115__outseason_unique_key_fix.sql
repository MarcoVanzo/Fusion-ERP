-- V115__outseason_unique_key_fix.sql
-- Fix unique key to include tenant_id to prevent clashes between tenants 
-- since outseason_verifications has a tenant_id column

-- 1. Drop the old unique key
ALTER TABLE outseason_verifications DROP INDEX uq_season_entry;

-- 2. Add the new composite unique key including tenant_id
ALTER TABLE outseason_verifications ADD UNIQUE KEY uq_osv_tenant_season_entry (tenant_id, season_key, entry_name);
