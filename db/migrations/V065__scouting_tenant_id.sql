-- V065__scouting_tenant_id.sql
-- Add tenant_id to scouting_athletes to support multi-tenancy

ALTER TABLE scouting_athletes
ADD COLUMN tenant_id VARCHAR(30) NOT NULL DEFAULT 'TNT_default' AFTER id,
ADD KEY idx_scounting_tenant (tenant_id);
