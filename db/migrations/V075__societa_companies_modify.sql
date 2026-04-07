-- ─────────────────────────────────────────────────────────────────────────────
-- V075__societa_companies_modify.sql
-- Modulo Società: Modifica campi companies (aggiunta social, rimozione inutilizzati)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `societa_companies`
    ADD COLUMN `website` VARCHAR(255) NULL AFTER `legal_address`,
    ADD COLUMN `facebook` VARCHAR(255) NULL AFTER `website`,
    ADD COLUMN `instagram` VARCHAR(255) NULL AFTER `facebook`,
    CHANGE COLUMN `notes` `description` TEXT NULL;

ALTER TABLE `societa_companies`
    DROP COLUMN `company_type`,
    DROP COLUMN `operative_address`,
    DROP COLUMN `primary_color`,
    DROP COLUMN `secondary_color`;
