-- ─────────────────────────────────────────────────────────────────────────────
-- V074__societa_companies.sql
-- Modulo Società: Inserimento società multiple (aziende/società del gruppo)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `societa_companies` (
    `id`                 VARCHAR(20)     NOT NULL,
    `tenant_id`          VARCHAR(30)     NOT NULL,
    `name`               VARCHAR(255)    NOT NULL,
    `company_type`       VARCHAR(100)    NULL,
    `vat_number`         VARCHAR(50)     NULL,
    `legal_address`      VARCHAR(500)    NULL,
    `operative_address`  VARCHAR(500)    NULL,
    `primary_color`      VARCHAR(7)      NULL,
    `secondary_color`    VARCHAR(7)      NULL,
    `logo_path`          VARCHAR(500)    NULL,
    `referent_name`      VARCHAR(255)    NULL,
    `referent_contact`   VARCHAR(255)    NULL,
    `notes`              TEXT            NULL,
    `created_at`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_deleted`         TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_societa_companies_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
