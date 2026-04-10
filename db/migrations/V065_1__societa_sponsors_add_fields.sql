-- ─────────────────────────────────────────────────────────────────────────────
-- V065__societa_sponsors_add_fields.sql
-- Modulo Società — Tab Sponsor: aggiunta dei campi stagione, importo, rapporto, sponsorizzazione
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `societa_sponsors` 
ADD COLUMN `stagione` VARCHAR(50) NULL AFTER `name`,
ADD COLUMN `importo` DECIMAL(10,2) NULL AFTER `tiktok_url`,
ADD COLUMN `rapporto` DECIMAL(10,2) NULL AFTER `importo`,
ADD COLUMN `sponsorizzazione` DECIMAL(10,2) NULL AFTER `rapporto`;
