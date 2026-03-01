-- V013__outseason_entries.sql — Out Season Cognito Entries Cache
-- Stores all entries fetched from Cognito Forms OData API.
-- Updated nightly via cron (or manually via the admin UI sync button).

CREATE TABLE IF NOT EXISTS outseason_entries (
    id                      INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    cognito_id              INT UNSIGNED     NOT NULL                 COMMENT 'Cognito Forms Entry Id',
    season_key              VARCHAR(10)      NOT NULL                 COMMENT 'e.g. 2026',

    -- Athlete info
    nome_e_cognome          VARCHAR(200)     NOT NULL,
    email                   VARCHAR(200)     NULL,
    cellulare               VARCHAR(50)      NULL,
    codice_fiscale          VARCHAR(20)      NULL,
    data_di_nascita         DATE             NULL,
    indirizzo               VARCHAR(255)     NULL,
    cap                     VARCHAR(10)      NULL,
    citta                   VARCHAR(100)     NULL,
    provincia               VARCHAR(50)      NULL,

    -- Club & sport
    club_di_appartenenza    VARCHAR(200)     NULL,
    ruolo                   VARCHAR(50)      NULL,
    taglia_kit              VARCHAR(10)      NULL,

    -- Registration
    settimana_scelta        VARCHAR(100)     NULL,
    formula_scelta          VARCHAR(200)     NULL,
    come_vuoi_pagare        VARCHAR(100)     NULL,
    codice_sconto           VARCHAR(50)      NULL,
    entry_date              DATETIME         NULL,
    entry_status            VARCHAR(50)      NULL,
    order_summary           VARCHAR(200)     NULL,

    -- Sync metadata
    synced_at               DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_cognito_season (cognito_id, season_key),
    INDEX idx_ose_season (season_key),
    INDEX idx_ose_nome (nome_e_cognome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
