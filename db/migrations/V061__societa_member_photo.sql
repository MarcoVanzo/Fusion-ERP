-- ─────────────────────────────────────────────────────────────────────────────
-- V061__societa_member_photo.sql
-- Aggiunge il campo photo_path alla tabella societa_members
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `societa_members` ADD COLUMN `photo_path` VARCHAR(500) NULL AFTER `full_name`;
