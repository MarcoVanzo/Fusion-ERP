-- V028__anagrafica_extended.sql — Extended Athlete Data Model
-- Adds: guardians, biometric_records, athletic_metrics, injury_records,
--        athlete_documents, payment_plans, installments, transactions,
--        gdpr_consents, notification_log + athlete column extensions
-- SAFE: All ALTER TABLE operations use ADD COLUMN — no existing columns modified.

-- ─── 1. ATHLETE COLUMN EXTENSIONS ──────────────────────────────────────────────

ALTER TABLE athletes ADD COLUMN tenant_id VARCHAR(20) NULL AFTER id;
ALTER TABLE athletes ADD COLUMN nationality VARCHAR(50) NULL AFTER residence_city;
ALTER TABLE athletes ADD COLUMN blood_group VARCHAR(5) NULL AFTER nationality;
ALTER TABLE athletes ADD COLUMN allergies TEXT NULL AFTER blood_group;
ALTER TABLE athletes ADD COLUMN medications TEXT NULL AFTER allergies;
ALTER TABLE athletes ADD COLUMN emergency_contact_name VARCHAR(150) NULL AFTER parent_phone;
ALTER TABLE athletes ADD COLUMN emergency_contact_phone VARCHAR(30) NULL AFTER emergency_contact_name;
ALTER TABLE athletes ADD COLUMN communication_preference ENUM('WHATSAPP','EMAIL','SMS','PUSH') NULL DEFAULT 'EMAIL' AFTER emergency_contact_phone;
ALTER TABLE athletes ADD COLUMN image_release_consent TINYINT(1) NOT NULL DEFAULT 0 AFTER communication_preference;
ALTER TABLE athletes ADD COLUMN medical_cert_file_path VARCHAR(500) NULL AFTER medical_cert_expires_at;
ALTER TABLE athletes ADD COLUMN medical_cert_issued_at DATE NULL AFTER medical_cert_file_path;

-- Backfill tenant_id from the default tenant for existing athletes
UPDATE athletes SET tenant_id = 'TNT_default' WHERE tenant_id IS NULL;

-- Index on tenant_id for multi-tenant queries
ALTER TABLE athletes ADD INDEX idx_athletes_tenant (tenant_id);

-- ─── 2. GUARDIANS ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guardians (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    athlete_id      VARCHAR(20)  NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    relationship    VARCHAR(50)  NOT NULL,         -- padre, madre, tutore
    phone           VARCHAR(30)  NULL,
    email           VARCHAR(150) NULL,
    fiscal_code     VARCHAR(16)  NULL,
    is_primary      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_guardians_athlete (athlete_id),
    INDEX idx_guardians_tenant (tenant_id),
    CONSTRAINT fk_guardians_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_guardians_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 3. BIOMETRIC RECORDS (Time-Series) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS biometric_records (
    id              VARCHAR(20)   NOT NULL,
    tenant_id       VARCHAR(20)   NOT NULL,
    athlete_id      VARCHAR(20)   NOT NULL,
    record_date     DATE          NOT NULL,
    height_cm       SMALLINT      NULL,
    weight_kg       DECIMAL(5,1)  NULL,
    bmi             DECIMAL(4,1)  NULL,           -- auto-calculated
    wingspan_cm     SMALLINT      NULL,
    measured_by     VARCHAR(20)   NULL,           -- user_id who recorded
    notes           TEXT          NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_bio_athlete_date (athlete_id, record_date),
    INDEX idx_bio_tenant (tenant_id),
    CONSTRAINT fk_bio_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_bio_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
    CONSTRAINT fk_bio_measurer FOREIGN KEY (measured_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 4. ATHLETIC METRICS ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS athletic_metrics (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    athlete_id      VARCHAR(20)  NOT NULL,
    record_date     DATE         NOT NULL,
    metric_type     VARCHAR(50)  NOT NULL,        -- SPRINT_10M, VERTICAL_JUMP_CMJ, VO2MAX, etc.
    value           DECIMAL(10,2) NOT NULL,
    unit            VARCHAR(20)  NOT NULL,        -- sec, cm, ml/kg/min, bpm, etc.
    measured_by     VARCHAR(20)  NULL,
    notes           TEXT         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_am_athlete_type (athlete_id, metric_type, record_date),
    INDEX idx_am_tenant (tenant_id),
    CONSTRAINT fk_am_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_am_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
    CONSTRAINT fk_am_measurer FOREIGN KEY (measured_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 5. INJURY RECORDS ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS injury_records (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    athlete_id      VARCHAR(20)  NOT NULL,
    injury_date     DATE         NOT NULL,
    type            VARCHAR(100) NOT NULL,        -- distorsione, frattura, stiramento, etc.
    body_part       VARCHAR(100) NOT NULL,        -- caviglia dx, ginocchio sx, etc.
    severity        VARCHAR(20)  NOT NULL DEFAULT 'moderate', -- mild, moderate, severe
    stop_days       SMALLINT     NULL,
    return_date     DATE         NULL,
    notes           TEXT         NULL,
    treated_by      VARCHAR(150) NULL,            -- doctor/physio name
    created_by      VARCHAR(20)  NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_inj_athlete (athlete_id),
    INDEX idx_inj_tenant (tenant_id),
    CONSTRAINT fk_inj_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_inj_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
    CONSTRAINT fk_inj_creator FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 6. ATHLETE DOCUMENTS ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS athlete_documents (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    athlete_id      VARCHAR(20)  NOT NULL,
    doc_type        VARCHAR(30)  NOT NULL,        -- ID_CARD, PASSPORT, FEDERATION_CARD, MEDICAL_CERTIFICATE, etc.
    file_name       VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    upload_date     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expiry_date     DATE         NULL,
    uploaded_by     VARCHAR(20)  NULL,
    deleted_at      DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_doc_athlete (athlete_id),
    INDEX idx_doc_tenant (tenant_id),
    INDEX idx_doc_type (doc_type),
    INDEX idx_doc_expiry (expiry_date),
    INDEX idx_doc_deleted (deleted_at),
    CONSTRAINT fk_doc_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id)  ON DELETE CASCADE,
    CONSTRAINT fk_doc_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)   ON DELETE CASCADE,
    CONSTRAINT fk_doc_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id)   ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 7. PAYMENT PLANS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_plans (
    id              VARCHAR(20)   NOT NULL,
    tenant_id       VARCHAR(20)   NOT NULL,
    athlete_id      VARCHAR(20)   NOT NULL,
    total_amount    DECIMAL(10,2) NOT NULL,
    frequency       ENUM('MONTHLY','QUARTERLY','SEMI_ANNUAL','ANNUAL','CUSTOM') NOT NULL DEFAULT 'MONTHLY',
    start_date      DATE          NOT NULL,
    season          VARCHAR(10)   NULL,           -- e.g. 2025-26
    status          VARCHAR(20)   NOT NULL DEFAULT 'active', -- active, completed, cancelled
    notes           TEXT          NULL,
    created_by      VARCHAR(20)   NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_pp_athlete (athlete_id),
    INDEX idx_pp_tenant (tenant_id),
    INDEX idx_pp_status (status),
    CONSTRAINT fk_pp_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id)  ON DELETE CASCADE,
    CONSTRAINT fk_pp_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)   ON DELETE CASCADE,
    CONSTRAINT fk_pp_creator FOREIGN KEY (created_by) REFERENCES users(id)     ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 8. INSTALLMENTS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS installments (
    id              VARCHAR(20)   NOT NULL,
    plan_id         VARCHAR(20)   NOT NULL,
    due_date        DATE          NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    status          ENUM('PENDING','PAID','OVERDUE','REFUNDED') NOT NULL DEFAULT 'PENDING',
    paid_date       DATE          NULL,
    payment_method  ENUM('BANK_TRANSFER','CARD','CASH','SEPA','STRIPE','OTHER') NULL,
    receipt_path    VARCHAR(500)  NULL,
    notes           TEXT          NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_inst_plan (plan_id),
    INDEX idx_inst_status (status),
    INDEX idx_inst_due (due_date),
    CONSTRAINT fk_inst_plan FOREIGN KEY (plan_id) REFERENCES payment_plans(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 9. TRANSACTIONS ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS transactions (
    id              VARCHAR(20)   NOT NULL,
    tenant_id       VARCHAR(20)   NOT NULL,
    athlete_id      VARCHAR(20)   NOT NULL,
    installment_id  VARCHAR(20)   NULL,
    amount          DECIMAL(10,2) NOT NULL,
    transaction_date DATE         NOT NULL,
    payment_method  ENUM('BANK_TRANSFER','CARD','CASH','SEPA','STRIPE','OTHER') NOT NULL,
    reference       VARCHAR(100)  NULL,           -- bank ref, stripe payment_id, etc.
    created_by      VARCHAR(20)   NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_tx_athlete (athlete_id),
    INDEX idx_tx_tenant (tenant_id),
    INDEX idx_tx_installment (installment_id),
    CONSTRAINT fk_tx_athlete     FOREIGN KEY (athlete_id)     REFERENCES athletes(id)       ON DELETE CASCADE,
    CONSTRAINT fk_tx_tenant      FOREIGN KEY (tenant_id)      REFERENCES tenants(id)        ON DELETE CASCADE,
    CONSTRAINT fk_tx_installment FOREIGN KEY (installment_id) REFERENCES installments(id)   ON DELETE SET NULL,
    CONSTRAINT fk_tx_creator     FOREIGN KEY (created_by)     REFERENCES users(id)          ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 10. GDPR CONSENTS ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gdpr_consents (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    athlete_id      VARCHAR(20)  NOT NULL,
    consent_type    VARCHAR(50)  NOT NULL,        -- DATA_PROCESSING, IMAGE_RELEASE, MARKETING, HEALTH_DATA
    granted         TINYINT(1)   NOT NULL DEFAULT 0,
    granted_at      DATETIME     NULL,
    granted_by      VARCHAR(20)  NULL,            -- user_id (guardian for minors)
    ip_address      VARCHAR(45)  NULL,
    revoked_at      DATETIME     NULL,
    notes           TEXT         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_gdpr_athlete (athlete_id),
    INDEX idx_gdpr_tenant (tenant_id),
    INDEX idx_gdpr_type (consent_type),
    CONSTRAINT fk_gdpr_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_gdpr_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
    CONSTRAINT fk_gdpr_granter FOREIGN KEY (granted_by) REFERENCES users(id)    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── 11. NOTIFICATION LOG ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_log (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    notification_type VARCHAR(50) NOT NULL,       -- CERTIFICATE_EXPIRY, PAYMENT_OVERDUE, PAYMENT_DUE_SOON, DOCUMENT_EXPIRY
    athlete_id      VARCHAR(20)  NULL,
    recipient_email VARCHAR(255) NULL,
    subject         VARCHAR(255) NULL,
    sent_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          VARCHAR(20)  NOT NULL DEFAULT 'sent', -- sent, failed, pending
    error_message   TEXT         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notif_tenant (tenant_id),
    INDEX idx_notif_athlete (athlete_id),
    INDEX idx_notif_type (notification_type),
    INDEX idx_notif_sent (sent_at),
    CONSTRAINT fk_notif_tenant  FOREIGN KEY (tenant_id)  REFERENCES tenants(id)  ON DELETE CASCADE,
    CONSTRAINT fk_notif_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
