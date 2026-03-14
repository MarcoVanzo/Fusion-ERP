-- ─────────────────────────────────────────────────────────────────────────────
-- V059__foresteria.sql
-- Modulo La Foresteria: spese, media (foto/video), info singleton
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── Info / Descrizione (singleton per tenant) ────────────────────────────────
CREATE TABLE IF NOT EXISTS `foresteria_info` (
    `id`          VARCHAR(20)   NOT NULL,
    `tenant_id`   VARCHAR(30)   NOT NULL,
    `description` TEXT          NULL  COMMENT 'Descrizione testuale della foresteria',
    `address`     VARCHAR(255)  NOT NULL DEFAULT 'Via Bazzera 16, 30030 Martellago (VE)',
    `lat`         DECIMAL(10,7) NOT NULL DEFAULT 45.5440000,
    `lng`         DECIMAL(10,7) NOT NULL DEFAULT 12.1580000,
    `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_foresteria_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Spese ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `foresteria_expenses` (
    `id`           VARCHAR(20)   NOT NULL,
    `tenant_id`    VARCHAR(30)   NOT NULL,
    `description`  VARCHAR(255)  NOT NULL,
    `amount`       DECIMAL(10,2) NOT NULL DEFAULT 0,
    `category`     VARCHAR(100)  NULL  COMMENT 'Manutenzione, Pulizie, Utenze, Cibo, Altro',
    `expense_date` DATE          NOT NULL,
    `receipt_path` VARCHAR(500)  NULL  COMMENT 'Path relativo al file ricevuta',
    `notes`        TEXT          NULL,
    `created_by`   VARCHAR(30)   NULL,
    `is_deleted`   TINYINT(1)    NOT NULL DEFAULT 0,
    `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_fe_tenant` (`tenant_id`),
    KEY `idx_fe_date`   (`expense_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Media (foto/video) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `foresteria_media` (
    `id`          VARCHAR(20)                    NOT NULL,
    `tenant_id`   VARCHAR(30)                    NOT NULL,
    `type`        ENUM('photo','video')           NOT NULL DEFAULT 'photo',
    `file_path`   VARCHAR(500)                   NOT NULL,
    `title`       VARCHAR(255)                   NULL,
    `description` TEXT                           NULL,
    `is_deleted`  TINYINT(1)                     NOT NULL DEFAULT 0,
    `uploaded_at` DATETIME                       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_fm_tenant` (`tenant_id`),
    KEY `idx_fm_type`   (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
