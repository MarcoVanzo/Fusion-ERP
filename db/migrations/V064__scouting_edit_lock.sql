-- ─────────────────────────────────────────────────────────────────────────────
-- V064__scouting_edit_lock.sql
-- Aggiunge il campo is_locked_edit per proteggere le modifiche manuali agli atleti importati
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `scouting_athletes` 
ADD COLUMN `is_locked_edit` TINYINT(1) NOT NULL DEFAULT 0 AFTER `source`;
