-- V004__admin.sql — Medical Certificates, Contracts, Documents
-- Dependencies: V002__sports.sql

USE fusion_erp;

-- ─── MEDICAL CERTIFICATES ─────────────────────────────────────────────────────
CREATE TABLE medical_certificates (
    id                   VARCHAR(20)  NOT NULL,   -- e.g. MED_f1a9c7d2
    athlete_id           VARCHAR(20)  NOT NULL,
    type                 ENUM('agonistico','non_agonistico') NOT NULL DEFAULT 'agonistico',
    issue_date           DATE         NULL,
    expiry_date          DATE         NOT NULL,
    ocr_extracted_date   DATE         NULL,        -- what Gemini extracted
    file_path            VARCHAR(500) NULL,        -- hashed filename in storage
    original_filename    VARCHAR(255) NULL,
    status               VARCHAR(30)  NOT NULL DEFAULT 'active', -- active, expired, revoked
    notes                TEXT         NULL,
    uploaded_by          VARCHAR(20)  NULL,
    deleted_at           DATETIME     NULL,
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_medcert_athlete (athlete_id),
    INDEX idx_medcert_expiry (expiry_date),
    INDEX idx_medcert_status (status),
    CONSTRAINT fk_medcert_athlete  FOREIGN KEY (athlete_id)  REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_medcert_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CONTRACTS (Collaboratori Sportivi — Riforma dello Sport) ─────────────────
CREATE TABLE contracts (
    id              VARCHAR(20)  NOT NULL,        -- e.g. CTR_g2b8e4c0
    user_id         VARCHAR(20)  NOT NULL,
    type            VARCHAR(80)  NOT NULL DEFAULT 'collaboratore_sportivo',
    role_description VARCHAR(300) NULL,
    valid_from      DATE         NOT NULL,
    valid_to        DATE         NOT NULL,
    monthly_fee_eur DECIMAL(10,2) NULL,
    pdf_path        VARCHAR(500) NULL,
    status          VARCHAR(30)  NOT NULL DEFAULT 'draft',  -- draft, signed, expired, cancelled
    signed_at       DATETIME     NULL,
    created_by      VARCHAR(20)  NULL,
    deleted_at      DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_contracts_user (user_id),
    INDEX idx_contracts_status (status),
    INDEX idx_contracts_validity (valid_from, valid_to),
    CONSTRAINT fk_contracts_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_contracts_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── GENERAL DOCUMENTS ARCHIVE ────────────────────────────────────────────────
CREATE TABLE documents (
    id            VARCHAR(20)  NOT NULL,
    entity_type   VARCHAR(50)  NOT NULL,          -- athlete, user, team
    entity_id     VARCHAR(20)  NOT NULL,
    title         VARCHAR(200) NOT NULL,
    category      VARCHAR(80)  NULL,              -- e.g. privacy, statuto, tessera
    file_path     VARCHAR(500) NOT NULL,
    file_size_kb  INT          NULL,
    mime_type     VARCHAR(100) NULL,
    is_public     TINYINT(1)   NOT NULL DEFAULT 0,
    uploaded_by   VARCHAR(20)  NULL,
    deleted_at    DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_docs_entity (entity_type, entity_id),
    INDEX idx_docs_category (category),
    CONSTRAINT fk_docs_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ACWR RISK ALERTS LOG ─────────────────────────────────────────────────────
CREATE TABLE acwr_alerts (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    athlete_id  VARCHAR(20)  NOT NULL,
    acwr_score  DECIMAL(6,4) NOT NULL,
    risk_level  ENUM('low','moderate','high','extreme') NOT NULL,
    log_date    DATE         NOT NULL,
    ack_by      VARCHAR(20)  NULL,
    ack_at      DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_alerts_athlete (athlete_id),
    INDEX idx_alerts_date (log_date),
    INDEX idx_alerts_risk (risk_level),
    CONSTRAINT fk_alerts_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_alerts_ack     FOREIGN KEY (ack_by)     REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
