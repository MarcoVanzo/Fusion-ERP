-- V012 — Backup Metadata Table
-- Fusion ERP — 2026-03-01

CREATE TABLE IF NOT EXISTS backups (
    id           VARCHAR(36)   NOT NULL PRIMARY KEY,          -- BKP_xxxx
    filename     VARCHAR(255)  NOT NULL,
    filesize     BIGINT        NOT NULL DEFAULT 0,            -- bytes
    tables_list  TEXT          NOT NULL,                      -- JSON array of table names
    table_count  SMALLINT      NOT NULL DEFAULT 0,
    row_count    INT           NOT NULL DEFAULT 0,            -- total rows exported
    created_by   VARCHAR(36)   NULL,
    status       ENUM('ok','error') NOT NULL DEFAULT 'ok',
    notes        TEXT          NULL,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_backups_created_at (created_at DESC),
    CONSTRAINT fk_backups_user FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
