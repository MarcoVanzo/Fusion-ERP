-- V058__team_seasons_is_active.sql
-- Add is_active flag to team_seasons table to allow toggling active seasons

ALTER TABLE `team_seasons` 
ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1 AFTER `season`;
