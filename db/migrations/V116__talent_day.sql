-- V116: Talent Day entries table
-- Stores registration data from Talent Day events with both
-- biographical/contact and physical measurement columns.

CREATE TABLE IF NOT EXISTS talent_day_entries (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           VARCHAR(50)   NOT NULL DEFAULT 'TNT_fusion',

    -- Dati Registrazione
    data_registrazione  DATETIME      NULL,
    ora_registrazione   TIME          NULL,
    email               VARCHAR(255)  NULL,
    tappa               VARCHAR(100)  NULL,

    -- Dati Anagrafici
    nome                VARCHAR(100)  NOT NULL,
    cognome             VARCHAR(100)  NOT NULL,
    indirizzo           VARCHAR(255)  NULL,
    citta_cap           VARCHAR(100)  NULL,
    data_nascita        DATE          NULL,
    cellulare           VARCHAR(30)   NULL,
    taglia_tshirt       VARCHAR(10)   NULL,
    club_tesseramento   VARCHAR(150)  NULL,
    ruolo               VARCHAR(50)   NULL,
    campionati          VARCHAR(255)  NULL,

    -- Dati Genitore / Tutore
    nome_genitore       VARCHAR(100)  NULL,
    telefono_genitore   VARCHAR(30)   NULL,
    email_genitore      VARCHAR(255)  NULL,

    -- Dati Fisici / Metriche
    altezza             DECIMAL(5,2)  NULL COMMENT 'cm',
    peso                DECIMAL(5,2)  NULL COMMENT 'kg',
    reach_cm            DECIMAL(5,2)  NULL COMMENT 'cm',
    cmj                 DECIMAL(5,2)  NULL COMMENT 'cm',
    salto_rincorsa      DECIMAL(5,2)  NULL COMMENT 'cm',

    -- Metadata
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_td_tenant (tenant_id),
    INDEX idx_td_tappa  (tappa),
    INDEX idx_td_cognome (cognome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
