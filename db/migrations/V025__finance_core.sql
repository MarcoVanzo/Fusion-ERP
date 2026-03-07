-- V025__finance_core.sql — Accounting for ASD/SSD (Contabilità)
-- Chart of Accounts (Piano dei Conti), Journal Entries (Prima Nota), Journal Lines (Righe)
-- Pre-seeded with standard ASD chart following CONI/ETS guidelines

-- ─── CHART OF ACCOUNTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id          VARCHAR(20)  NOT NULL,
    tenant_id   VARCHAR(20)  NOT NULL,
    code        VARCHAR(20)  NOT NULL,          -- e.g. "1.1.01"
    name        VARCHAR(200) NOT NULL,
    type        VARCHAR(30)  NOT NULL,          -- entrata, uscita, patrimoniale_attivo, patrimoniale_passivo
    parent_id   VARCHAR(20)  NULL,
    is_system   TINYINT(1)   NOT NULL DEFAULT 0,  -- system accounts cannot be deleted
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_coa_tenant (tenant_id),
    INDEX idx_coa_code (tenant_id, code),
    INDEX idx_coa_type (type),
    CONSTRAINT fk_coa_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── JOURNAL ENTRIES (Prima Nota) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS journal_entries (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    entry_number    INT          NOT NULL,         -- progressive per tenant per year
    entry_date      DATE         NOT NULL,
    description     VARCHAR(300) NOT NULL,
    reference       VARCHAR(100) NULL,             -- document number, invoice ref
    total_amount    DECIMAL(12,2) NOT NULL DEFAULT 0,
    payment_method  VARCHAR(50)  NULL,             -- contanti, bonifico, carta, assegno
    category        VARCHAR(50)  NULL,             -- quote_soci, sponsor, stipendi, utenze, etc.
    attachment_path VARCHAR(500) NULL,             -- scanned receipt
    is_recurring    TINYINT(1)   NOT NULL DEFAULT 0,
    created_by      VARCHAR(20)  NULL,
    deleted_at      DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_je_tenant_date (tenant_id, entry_date),
    INDEX idx_je_category (category),
    INDEX idx_je_number (tenant_id, entry_number),
    CONSTRAINT fk_je_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_je_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── JOURNAL LINES (Righe Prima Nota — Partita Doppia) ───────────────────────
CREATE TABLE IF NOT EXISTS journal_lines (
    id          VARCHAR(20)  NOT NULL,
    entry_id    VARCHAR(20)  NOT NULL,
    account_id  VARCHAR(20)  NOT NULL,
    debit       DECIMAL(12,2) NOT NULL DEFAULT 0,
    credit      DECIMAL(12,2) NOT NULL DEFAULT 0,
    notes       VARCHAR(300) NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_jl_entry (entry_id),
    INDEX idx_jl_account (account_id),
    CONSTRAINT fk_jl_entry   FOREIGN KEY (entry_id)   REFERENCES journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_jl_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── FISCAL YEAR PERIODS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiscal_years (
    id          VARCHAR(20) NOT NULL,
    tenant_id   VARCHAR(20) NOT NULL,
    label       VARCHAR(50) NOT NULL,           -- e.g. "2025-2026"
    start_date  DATE        NOT NULL,
    end_date    DATE        NOT NULL,
    is_current  TINYINT(1)  NOT NULL DEFAULT 0,
    is_closed   TINYINT(1)  NOT NULL DEFAULT 0,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fy_tenant (tenant_id),
    CONSTRAINT fk_fy_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── SEED: Default ASD Chart of Accounts (Piano dei Conti ETS) ────────────────
-- Uses TNT_default tenant. On tenant creation, these will be cloned.

-- ENTRATE
INSERT IGNORE INTO chart_of_accounts (id, tenant_id, code, name, type, is_system, sort_order) VALUES
('COA_E01', 'TNT_default', '1.01', 'Quote associative', 'entrata', 1, 100),
('COA_E02', 'TNT_default', '1.02', 'Quote iscrizione corsi', 'entrata', 1, 110),
('COA_E03', 'TNT_default', '1.03', 'Contributi pubblici', 'entrata', 1, 120),
('COA_E04', 'TNT_default', '1.04', 'Contributi da privati / Sponsorizzazioni', 'entrata', 1, 130),
('COA_E05', 'TNT_default', '1.05', 'Proventi attività commerciale', 'entrata', 1, 140),
('COA_E06', 'TNT_default', '1.06', 'Donazioni e liberalità', 'entrata', 1, 150),
('COA_E07', 'TNT_default', '1.07', 'Ricavi da eventi e manifestazioni', 'entrata', 1, 160),
('COA_E08', 'TNT_default', '1.08', 'Interessi attivi bancari', 'entrata', 1, 170),
('COA_E09', 'TNT_default', '1.09', 'Entrate diverse', 'entrata', 1, 180),
('COA_E10', 'TNT_default', '1.10', '5 per mille', 'entrata', 1, 190),
('COA_E11', 'TNT_default', '1.11', 'Rimborsi e recuperi spese', 'entrata', 1, 200);

-- USCITE
INSERT IGNORE INTO chart_of_accounts (id, tenant_id, code, name, type, is_system, sort_order) VALUES
('COA_U01', 'TNT_default', '2.01', 'Compensi collaboratori sportivi', 'uscita', 1, 300),
('COA_U02', 'TNT_default', '2.02', 'Rimborsi spese collaboratori', 'uscita', 1, 310),
('COA_U03', 'TNT_default', '2.03', 'Affitto impianti e palestre', 'uscita', 1, 320),
('COA_U04', 'TNT_default', '2.04', 'Utenze (luce, gas, acqua)', 'uscita', 1, 330),
('COA_U05', 'TNT_default', '2.05', 'Attrezzatura sportiva', 'uscita', 1, 340),
('COA_U06', 'TNT_default', '2.06', 'Tesseramenti e affiliazioni', 'uscita', 1, 350),
('COA_U07', 'TNT_default', '2.07', 'Assicurazioni', 'uscita', 1, 360),
('COA_U08', 'TNT_default', '2.08', 'Spese eventi e trasferte', 'uscita', 1, 370),
('COA_U09', 'TNT_default', '2.09', 'Spese amministrative', 'uscita', 1, 380),
('COA_U10', 'TNT_default', '2.10', 'Spese bancarie e commissioni', 'uscita', 1, 390),
('COA_U11', 'TNT_default', '2.11', 'Manutenzioni e riparazioni', 'uscita', 1, 400),
('COA_U12', 'TNT_default', '2.12', 'Pubblicità e promozione', 'uscita', 1, 410),
('COA_U13', 'TNT_default', '2.13', 'Consulenze professionali', 'uscita', 1, 420),
('COA_U14', 'TNT_default', '2.14', 'Uscite diverse', 'uscita', 1, 430);

-- PATRIMONIALE ATTIVO
INSERT IGNORE INTO chart_of_accounts (id, tenant_id, code, name, type, is_system, sort_order) VALUES
('COA_PA1', 'TNT_default', '3.01', 'Cassa contanti', 'patrimoniale_attivo', 1, 500),
('COA_PA2', 'TNT_default', '3.02', 'Conto corrente bancario', 'patrimoniale_attivo', 1, 510),
('COA_PA3', 'TNT_default', '3.03', 'Crediti verso soci', 'patrimoniale_attivo', 1, 520),
('COA_PA4', 'TNT_default', '3.04', 'Crediti diversi', 'patrimoniale_attivo', 1, 530),
('COA_PA5', 'TNT_default', '3.05', 'Rimanenze (magazzino)', 'patrimoniale_attivo', 1, 540);

-- PATRIMONIALE PASSIVO
INSERT IGNORE INTO chart_of_accounts (id, tenant_id, code, name, type, is_system, sort_order) VALUES
('COA_PP1', 'TNT_default', '4.01', 'Debiti verso fornitori', 'patrimoniale_passivo', 1, 600),
('COA_PP2', 'TNT_default', '4.02', 'Debiti verso erario', 'patrimoniale_passivo', 1, 610),
('COA_PP3', 'TNT_default', '4.03', 'Fondo cassa / Patrimonio netto', 'patrimoniale_passivo', 1, 620),
('COA_PP4', 'TNT_default', '4.04', 'Debiti diversi', 'patrimoniale_passivo', 1, 630);

-- SEED: Default Fiscal Year
INSERT IGNORE INTO fiscal_years (id, tenant_id, label, start_date, end_date, is_current) VALUES
('FY_2526', 'TNT_default', '2025-2026', '2025-09-01', '2026-08-31', 1);
