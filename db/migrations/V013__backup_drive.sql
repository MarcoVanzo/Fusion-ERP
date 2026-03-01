-- V013 — Add Google Drive fields to backups table
-- Fusion ERP — 2026-03-01

ALTER TABLE backups
    ADD COLUMN drive_file_id     VARCHAR(255) NULL COMMENT 'Google Drive file ID'
        AFTER notes,
    ADD COLUMN drive_uploaded_at DATETIME     NULL COMMENT 'Timestamp of Drive upload'
        AFTER drive_file_id;

-- Index for quick lookup of Drive-backed backups
CREATE INDEX idx_backups_drive ON backups (drive_file_id);
