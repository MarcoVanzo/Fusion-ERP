-- ─────────────────────────────────────────────────────────────────────────────
-- V060__foresteria_youtube.sql
-- Modifica tipo per includere youtube
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE `foresteria_media` 
MODIFY COLUMN `type` ENUM('photo', 'video', 'youtube') NOT NULL DEFAULT 'photo';
