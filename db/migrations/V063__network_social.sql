-- ─────────────────────────────────────────────────────────────────────────────
-- V063__network_social.sql
-- Aggiunge website, instagram, facebook, youtube e description a network_collaborations
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `network_collaborations`
    ADD COLUMN `website` VARCHAR(255) NULL AFTER `logo_path`,
    ADD COLUMN `instagram` VARCHAR(255) NULL AFTER `website`,
    ADD COLUMN `facebook` VARCHAR(255) NULL AFTER `instagram`,
    ADD COLUMN `youtube` VARCHAR(255) NULL AFTER `facebook`,
    ADD COLUMN `description` TEXT NULL AFTER `youtube`;
