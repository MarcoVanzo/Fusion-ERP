-- V005__saas_core.sql — Multi-Tenant, Additive RBAC, Relationship Model
-- Engine: InnoDB | Charset: utf8mb4_unicode_ci
-- Administrator configures the DB from Aruba panel

-- ─── TENANTS (Clubs/Società Sportive) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenants (
    id          VARCHAR(20)  NOT NULL,           -- e.g. TNT_1a2b3c
    name        VARCHAR(150) NOT NULL,
    domain      VARCHAR(150) NULL,               -- e.g. virtus.fusionerp.it
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_tenants_domain (domain)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── TENANT USERS (Pivot M:M with Additive Roles in JSON) ────────────────────
-- Assigns a user to a tenant. A user can belong to multiple tenants (e.g. parent with children in different clubs).
CREATE TABLE IF NOT EXISTS tenant_users (
    tenant_id   VARCHAR(20)  NOT NULL,
    user_id     VARCHAR(20)  NOT NULL,
    roles       JSON         NOT NULL,           -- Array of roles: e.g. ["parent", "secretary"]
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tenant_id, user_id),
    CONSTRAINT fk_tenant_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_tenant_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── USER RELATIONSHIPS (e.g. Parent <-> Child) ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_relationships (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    parent_user_id  VARCHAR(20)  NOT NULL,
    child_user_id   VARCHAR(20)  NOT NULL,
    relation_type   VARCHAR(50)  NOT NULL,       -- e.g. "father", "mother", "guardian"
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_user_rel (parent_user_id, child_user_id),
    CONSTRAINT fk_user_rel_parent FOREIGN KEY (parent_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_rel_child FOREIGN KEY (child_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── TEAMS (Squadre per Stagione) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id          VARCHAR(20)  NOT NULL,           -- e.g. TM_123abc
    tenant_id   VARCHAR(20)  NOT NULL,
    name        VARCHAR(100) NOT NULL,           -- e.g. "U18 Maschile"
    category    VARCHAR(50)  NULL,
    season_id   VARCHAR(50)  NOT NULL,           -- e.g. "2024-2025"
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_teams_tenant (tenant_id, season_id),
    CONSTRAINT fk_teams_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── TEAM MEMBERS (Pivot M:M tra Users e Teams) ───────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
    team_id     VARCHAR(20)  NOT NULL,
    user_id     VARCHAR(20)  NOT NULL,
    member_type VARCHAR(30)  NOT NULL,           -- player, coach, manager, staff
    status      VARCHAR(30)  NOT NULL DEFAULT 'active', -- active, injured, transferred, inactive
    joined_at   DATE         NOT NULL DEFAULT (CURRENT_DATE),
    left_at     DATE         NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (team_id, user_id),
    CONSTRAINT fk_team_members_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    CONSTRAINT fk_team_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── PAYMENTS COMPLESSI (Quote con distinzione Pagante/Beneficiario) ─────────
CREATE TABLE IF NOT EXISTS payments_invoices (
    id                  VARCHAR(20)  NOT NULL,
    tenant_id           VARCHAR(20)  NOT NULL,
    amount              DECIMAL(10,2) NOT NULL,
    status              VARCHAR(30)  NOT NULL DEFAULT 'pending',  -- pending, paid, overdue, cancelled
    due_date            DATE         NOT NULL,
    beneficiary_user_id VARCHAR(20)  NOT NULL,    -- L'atleta
    payer_user_id       VARCHAR(20)  NOT NULL,    -- Il genitore (o l'atleta se maggiorenne/stesso user)
    payment_method      VARCHAR(50)  NULL,
    paid_at             DATETIME     NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_payments_beneficiary (beneficiary_user_id),
    INDEX idx_payments_payer (payer_user_id),
    INDEX idx_payments_tenant (tenant_id),
    CONSTRAINT fk_payments_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_beneficiary FOREIGN KEY (beneficiary_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_payer FOREIGN KEY (payer_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MOCK SEED INITIAL TENANT AND RELATIONSHIPS FOR TESTING
INSERT IGNORE INTO tenants (id, name, domain) VALUES ('TNT_default', 'Virtus Roma', 'virtus.fusionerp.it');

-- Modifichiamo il seed admin assegnandogli il ruolo tenant (come JSON base)
INSERT IGNORE INTO tenant_users (tenant_id, user_id, roles) VALUES ('TNT_default', 'USR_admin0001', '["superadmin"]');
