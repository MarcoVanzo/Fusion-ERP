-- ─────────────────────────────────────────────────────────────────────────────
-- V050__network_collab_logo.sql
-- Aggiunge logo_path a network_collaborations
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `network_collaborations`
    ADD COLUMN `logo_path` VARCHAR(500) NULL AFTER `notes`;
