-- V127: Open Day entries table
-- Stores registration data from Open Day events.
-- Identical to talent_day_entries but WITHOUT the tappa column
-- (single event: 27 MAG 2026, Palavega Trivignano, 17:00-20:00).

CREATE TABLE IF NOT EXISTS open_day_entries (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id           VARCHAR(50)   NOT NULL DEFAULT 'TNT_fusion',

    -- Dati Registrazione
    data_registrazione  DATETIME      NULL,
    ora_registrazione   TIME          NULL,
    email               VARCHAR(255)  NULL,

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

    -- Privacy
    privacy_consent     TINYINT(1)    NOT NULL DEFAULT 0,

    -- Dati Fisici / Metriche
    altezza             DECIMAL(5,2)  NULL COMMENT 'cm',
    reach_cm            DECIMAL(5,2)  NULL COMMENT 'cm',
    salto_rincorsa_1    DECIMAL(5,2)  NULL COMMENT 'cm',
    salto_rincorsa_2    DECIMAL(5,2)  NULL COMMENT 'cm',
    salto_rincorsa_3    DECIMAL(5,2)  NULL COMMENT 'cm',

    -- Metadata
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_od_tenant  (tenant_id),
    INDEX idx_od_cognome (cognome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
