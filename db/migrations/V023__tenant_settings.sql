-- V023__tenant_settings.sql — Tenant configuration key-value store
-- Supports multi-tenant SaaS: each tenant can have custom settings
-- (sport type, federation, season format, branding, billing plan, etc.)

CREATE TABLE IF NOT EXISTS tenant_settings (
    tenant_id    VARCHAR(20)  NOT NULL,
    setting_key  VARCHAR(100) NOT NULL,
    setting_value TEXT         NULL,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, setting_key),
    CONSTRAINT fk_tenant_settings_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default tenant settings
INSERT IGNORE INTO tenant_settings (tenant_id, setting_key, setting_value) VALUES
    ('TNT_default', 'sport_type', 'pallavolo'),
    ('TNT_default', 'federation', 'FIPAV'),
    ('TNT_default', 'season_format', '2025-2026'),
    ('TNT_default', 'primary_color', '#E6007E'),
    ('TNT_default', 'plan_tier', 'pro'),
    ('TNT_default', 'club_name', 'Fusion Team Volley'),
    ('TNT_default', 'legal_form', 'ASD'),
    ('TNT_default', 'max_teams', '20'),
    ('TNT_default', 'max_athletes', '500');
