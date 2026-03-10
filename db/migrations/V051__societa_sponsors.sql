-- ─────────────────────────────────────────────────────────────────────────────
-- V051__societa_sponsors.sql
-- Modulo Società — Tab Sponsor: logo, link web, social, descrizione
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `societa_sponsors` (
    `id`            VARCHAR(20)     NOT NULL,
    `tenant_id`     VARCHAR(30)     NOT NULL,
    `name`          VARCHAR(200)    NOT NULL,
    `description`   TEXT            NULL,
    `logo_path`     VARCHAR(500)    NULL,
    `website_url`   VARCHAR(500)    NULL,
    `instagram_url` VARCHAR(500)    NULL,
    `facebook_url`  VARCHAR(500)    NULL,
    `linkedin_url`  VARCHAR(500)    NULL,
    `tiktok_url`    VARCHAR(500)    NULL,
    `sort_order`    SMALLINT        NOT NULL DEFAULT 0,
    `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
    `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_deleted`    TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_societa_sponsors_tenant`  (`tenant_id`),
    KEY `idx_societa_sponsors_sort`    (`tenant_id`, `sort_order`),
    KEY `idx_societa_sponsors_active`  (`tenant_id`, `is_active`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
