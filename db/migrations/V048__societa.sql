-- ─────────────────────────────────────────────────────────────────────────────
-- V048__societa.sql
-- Modulo Società: identità, organigramma, membri, documenti, scadenze
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Profilo Società (una riga per tenant) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS `societa_profile` (
    `id`                 INT             NOT NULL AUTO_INCREMENT,
    `tenant_id`          VARCHAR(30)     NOT NULL,
    `mission`            TEXT            NULL,
    `vision`             TEXT            NULL,
    `values`             TEXT            NULL,
    `founded_year`       SMALLINT        NULL,
    `primary_color`      VARCHAR(7)      NULL COMMENT 'Hex color, e.g. #FF0000',
    `secondary_color`    VARCHAR(7)      NULL,
    `logo_path`          VARCHAR(500)    NULL,
    `legal_address`      VARCHAR(500)    NULL,
    `operative_address`  VARCHAR(500)    NULL,
    `created_at`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_societa_profile_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Ruoli Organigramma ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `societa_roles` (
    `id`               VARCHAR(20)     NOT NULL,
    `tenant_id`        VARCHAR(30)     NOT NULL,
    `name`             VARCHAR(100)    NOT NULL,
    `description`      TEXT            NULL,
    `permissions_json` LONGTEXT        NULL COMMENT 'JSON array of permission strings',
    `parent_role_id`   VARCHAR(20)     NULL,
    `sort_order`       SMALLINT        NOT NULL DEFAULT 0,
    `created_at`       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_deleted`       TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_societa_roles_tenant`      (`tenant_id`),
    KEY `idx_societa_roles_parent`      (`parent_role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Membri ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `societa_members` (
    `id`          VARCHAR(20)  NOT NULL,
    `tenant_id`   VARCHAR(30)  NOT NULL,
    `user_id`     VARCHAR(30)  NULL COMMENT 'FK to users table (nullable: external person)',
    `role_id`     VARCHAR(20)  NOT NULL,
    `full_name`   VARCHAR(200) NOT NULL COMMENT 'Denormalised for external members',
    `email`       VARCHAR(200) NULL,
    `phone`       VARCHAR(50)  NULL,
    `start_date`  DATE         NULL,
    `end_date`    DATE         NULL,
    `is_active`   TINYINT(1)   NOT NULL DEFAULT 1,
    `notes`       TEXT         NULL,
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_deleted`  TINYINT(1)   NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_societa_members_tenant`  (`tenant_id`),
    KEY `idx_societa_members_role`    (`role_id`),
    KEY `idx_societa_members_user`    (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Documenti Societari ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `societa_documents` (
    `id`           VARCHAR(20)                                                        NOT NULL,
    `tenant_id`    VARCHAR(30)                                                        NOT NULL,
    `category`     ENUM('statuto','affiliazione','licenza','assicurazione','altro')   NOT NULL DEFAULT 'altro',
    `file_path`    VARCHAR(500)   NOT NULL,
    `file_name`    VARCHAR(255)   NOT NULL,
    `uploaded_at`  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `expiry_date`  DATE           NULL,
    `notes`        TEXT           NULL,
    `is_deleted`   TINYINT(1)     NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_societa_docs_tenant`   (`tenant_id`),
    KEY `idx_societa_docs_expiry`   (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Scadenze Federali ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `societa_deadlines` (
    `id`                  VARCHAR(20)                                                  NOT NULL,
    `tenant_id`           VARCHAR(30)   NOT NULL,
    `title`               VARCHAR(255)  NOT NULL,
    `due_date`            DATE          NOT NULL,
    `category`            VARCHAR(100)  NULL,
    `status`              ENUM('aperto','completato','scaduto','annullato')            NOT NULL DEFAULT 'aperto',
    `linked_document_id`  VARCHAR(20)   NULL,
    `notes`               TEXT          NULL,
    `created_at`          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `is_deleted`          TINYINT(1)    NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_societa_deadlines_tenant`   (`tenant_id`),
    KEY `idx_societa_deadlines_due`      (`due_date`),
    KEY `idx_societa_deadlines_status`   (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
