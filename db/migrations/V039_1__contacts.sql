-- V039__contacts.sql — Rubrica Contatti (import iPhone vCard)
-- Tabella per i contatti importati dall'iPhone o aggiunti manualmente.
-- Usata per risolvere i nomi nell'Inbox WhatsApp.

CREATE TABLE IF NOT EXISTS contacts (
    id               VARCHAR(40)     NOT NULL,
    name             VARCHAR(150)    NOT NULL,
    phone_raw        VARCHAR(50)     NOT NULL,
    phone_normalized VARCHAR(30)     NOT NULL,
    source           ENUM('vcard','manual') NOT NULL DEFAULT 'vcard',
    athlete_id       VARCHAR(40)     NULL,
    tenant_id        VARCHAR(40)     NOT NULL DEFAULT 'TNT_default',
    created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY  uq_phone_tenant   (phone_normalized, tenant_id),
    INDEX       idx_athlete       (athlete_id),
    INDEX       idx_tenant        (tenant_id),
    CONSTRAINT  fk_contact_athlete
        FOREIGN KEY (athlete_id)
        REFERENCES  athletes(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
