-- Database Migration V033: Add VALD Profile ID to athletes
-- Fusion ERP v1.0
-- Required for the VALD sync to map VALD profileId → internal athlete_id

ALTER TABLE `athletes`
    ADD COLUMN IF NOT EXISTS `vald_profile_id` VARCHAR(100) DEFAULT NULL
        COMMENT 'VALD Hub profile UUID for syncing ForceDecks data',
    ADD INDEX IF NOT EXISTS `idx_vald_profile_id` (`vald_profile_id`);
