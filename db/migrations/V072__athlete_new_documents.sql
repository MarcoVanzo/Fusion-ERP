-- ─────────────────────────────────────────────────────────────────────────────
-- V072__athlete_new_documents.sql
-- Aggiunta campi per liberatoria, privacy e documenti foresteria
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `athletes`
ADD COLUMN `photo_release_file_path` VARCHAR(500) NULL COMMENT 'Percorso file Liberatoria foto/video' AFTER `medical_cert_file_path`,
ADD COLUMN `privacy_policy_file_path` VARCHAR(500) NULL COMMENT 'Percorso file Informativa Privacy' AFTER `photo_release_file_path`,
ADD COLUMN `guesthouse_rules_file_path` VARCHAR(500) NULL COMMENT 'Percorso file Regolamento Foresteria' AFTER `privacy_policy_file_path`,
ADD COLUMN `guesthouse_delegate_file_path` VARCHAR(500) NULL COMMENT 'Percorso file Delega' AFTER `guesthouse_rules_file_path`,
ADD COLUMN `health_card_file_path` VARCHAR(500) NULL COMMENT 'Percorso file Tessera Sanitaria' AFTER `guesthouse_delegate_file_path`;
