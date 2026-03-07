-- V027__federation.sql — Federation Cards (Tesseramenti) + RASD Registration
-- Tracks per-athlete per-season federation cards and society registration

-- ─── FEDERATION CARDS (Tessere Federali) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS federation_cards (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    athlete_id      VARCHAR(20)  NOT NULL,       -- FK to athletes
    federation      VARCHAR(50)  NOT NULL,       -- FIPAV, FIGC, FIP, FIN, FIDAL, etc.
    card_number     VARCHAR(50)  NULL,
    season          VARCHAR(10)  NOT NULL,       -- e.g. "2025-2026"
    card_type       VARCHAR(30)  NOT NULL DEFAULT 'atleta', -- atleta, tecnico, dirigente
    status          VARCHAR(30)  NOT NULL DEFAULT 'pending', -- pending, active, expired, suspended, transferred
    requested_at    DATE         NULL,
    issued_at       DATE         NULL,
    expires_at      DATE         NULL,
    fee_amount      DECIMAL(8,2) NULL,           -- tesseramento cost
    fee_paid        TINYINT(1)   NOT NULL DEFAULT 0,
    notes           TEXT         NULL,
    created_by      VARCHAR(20)  NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fc_tenant (tenant_id),
    INDEX idx_fc_athlete (athlete_id),
    INDEX idx_fc_season (season),
    INDEX idx_fc_status (status),
    INDEX idx_fc_federation (federation),
    CONSTRAINT fk_fc_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
    CONSTRAINT fk_fc_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_fc_creator FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── RASD REGISTRATIONS (Registro Attività Sportive Dilettantistiche) ─────────
CREATE TABLE IF NOT EXISTS rasd_registrations (
    id                  VARCHAR(20)  NOT NULL,
    tenant_id           VARCHAR(20)  NOT NULL,
    rasd_code           VARCHAR(50)  NULL,         -- codice RASD assegnato
    registration_date   DATE         NULL,
    status              VARCHAR(30)  NOT NULL DEFAULT 'active', -- active, suspended, cancelled
    sport_type          VARCHAR(100) NOT NULL,
    legal_form          VARCHAR(50)  NOT NULL,      -- ASD, SSD, ASD-ETS
    affiliated_federation VARCHAR(50) NULL,         -- Federazione affiliata
    affiliation_number  VARCHAR(50)  NULL,
    last_renewal        DATE         NULL,
    next_renewal        DATE         NULL,
    notes               TEXT         NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rasd_tenant (tenant_id),
    INDEX idx_rasd_status (status),
    CONSTRAINT fk_rasd_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
