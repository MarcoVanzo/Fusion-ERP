-- V042__staff.sql
-- Staff Registry — personale tecnico e amministrativo

CREATE TABLE IF NOT EXISTS staff_members (
    id              VARCHAR(20)     NOT NULL,
    tenant_id       VARCHAR(20)     NOT NULL,
    first_name      VARCHAR(100)    NOT NULL,
    last_name       VARCHAR(100)    NOT NULL,
    role            VARCHAR(100)    DEFAULT NULL,   -- es. Allenatore, Medico, Prep. Atletico, Segreteria
    birth_date      DATE            DEFAULT NULL,
    birth_place     VARCHAR(100)    DEFAULT NULL,
    residence_address VARCHAR(255)  DEFAULT NULL,
    residence_city  VARCHAR(100)    DEFAULT NULL,
    phone           VARCHAR(50)     DEFAULT NULL,
    email           VARCHAR(150)    DEFAULT NULL,
    fiscal_code     VARCHAR(16)     DEFAULT NULL,
    identity_document VARCHAR(100)  DEFAULT NULL,
    medical_cert_expires_at DATE    DEFAULT NULL,
    notes           TEXT            DEFAULT NULL,
    is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_staff_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    INDEX idx_staff_tenant (tenant_id),
    INDEX idx_staff_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
