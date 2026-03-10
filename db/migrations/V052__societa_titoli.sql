-- ─────────────────────────────────────────────────────────────────────────────
-- V052__societa_titoli.sql
-- Modulo Società — Tab Titoli: campionato, categoria, piazzamento, finali nazionali
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `societa_titoli` (
    `id`                VARCHAR(20)     NOT NULL,
    `tenant_id`         VARCHAR(30)     NOT NULL,
    `stagione`          VARCHAR(10)     NOT NULL COMMENT 'Es. 2024/25',
    `campionato`        ENUM('provinciale','regionale','nazionale') NOT NULL DEFAULT 'provinciale',
    `categoria`         VARCHAR(100)    NOT NULL COMMENT 'Es. Under 18 Femminile',
    `piazzamento`       TINYINT         NOT NULL DEFAULT 1 COMMENT '1 = 1° posto, 2 = 2° posto, 3 = 3° posto',
    `finali_nazionali`  TINYINT(1)      NOT NULL DEFAULT 0 COMMENT 'Partecipazione alle finali nazionali',
    `note`              TEXT            NULL,
    `created_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_deleted`        TINYINT(1)      NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`),
    KEY `idx_societa_titoli_tenant`   (`tenant_id`),
    KEY `idx_societa_titoli_stagione` (`tenant_id`, `stagione`),
    KEY `idx_societa_titoli_active`   (`tenant_id`, `is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
