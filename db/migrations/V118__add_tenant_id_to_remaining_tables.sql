-- V118: Add tenant_id to tables that are missing multi-tenant isolation.
-- These tables were identified in the comprehensive audit as lacking the
-- tenant_id column, which is required for proper data isolation in a
-- multi-tenant SaaS architecture.
--
-- IMPORTANT: This migration assumes single-tenant data (TNT_fusion) exists.
-- All existing rows receive the default tenant to preserve data integrity.

-- ═══ Core tables missing tenant_id ═══

-- events: used by Transport, Tournaments — high-traffic table
ALTER TABLE events ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_events_tenant ON events (tenant_id);

-- tasks: used by TasksController
ALTER TABLE tasks ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_tasks_tenant ON tasks (tenant_id);

-- transports: used by TransportController
ALTER TABLE transports ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_transports_tenant ON transports (tenant_id);

-- contracts: used by AdminController
ALTER TABLE contracts ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_contracts_tenant ON contracts (tenant_id);

-- documents: used by DocumentsController
ALTER TABLE documents ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_documents_tenant ON documents (tenant_id);

-- gyms: used by TransportController
ALTER TABLE gyms ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_gyms_tenant ON gyms (tenant_id);

-- attendances: used by TeamsController
ALTER TABLE attendances ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_attendances_tenant ON attendances (tenant_id);

-- tournament_details: used by TournamentsController
ALTER TABLE tournament_details ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_tournament_details_tenant ON tournament_details (tenant_id);

-- tournament_expenses: used by TournamentsController
ALTER TABLE tournament_expenses ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_tournament_expenses_tenant ON tournament_expenses (tenant_id);

-- tournament_matches: used by TournamentsController
ALTER TABLE tournament_matches ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_tournament_matches_tenant ON tournament_matches (tenant_id);

-- federation_standings: used by FederationController
ALTER TABLE federation_standings ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_federation_standings_tenant ON federation_standings (tenant_id);

-- ═══ System/reference tables — tenant_id optional but useful for audit ═══

-- audit_logs: tenant scoping ensures admins only see their tenant's logs
ALTER TABLE audit_logs ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_audit_logs_tenant ON audit_logs (tenant_id);

-- users: critical for security — prevents cross-tenant user enumeration
ALTER TABLE users ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion' AFTER id;
CREATE INDEX idx_users_tenant ON users (tenant_id);

-- ═══ Linking/child tables — inherit tenant from parent for consistency ═══

-- athlete_teams: linking table, tenant via parent
ALTER TABLE athlete_teams ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion';
CREATE INDEX idx_athlete_teams_tenant ON athlete_teams (tenant_id);

-- staff_teams: linking table
ALTER TABLE staff_teams ADD COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion';
CREATE INDEX idx_staff_teams_tenant ON staff_teams (tenant_id);

-- login_attempts: security table, useful to have tenant context
ALTER TABLE login_attempts ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'TNT_fusion';

-- password_history: user-scoped but tenant-awareness helps
ALTER TABLE password_history ADD COLUMN tenant_id VARCHAR(50) DEFAULT 'TNT_fusion';
