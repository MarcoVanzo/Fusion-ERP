-- V057__team_seasons_refactor.sql
-- Refactoring teams to an N:N relationship with seasons

-- 1. Create the new team_seasons table
CREATE TABLE IF NOT EXISTS `team_seasons` (
    `id`             VARCHAR(32)  NOT NULL,           -- e.g. TM_SEA_123abc
    `team_id`        VARCHAR(20)  NOT NULL,           -- FK to teams.id
    `season`         VARCHAR(50)  NOT NULL,           -- e.g. "2024-2025"
    `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_team_season` (`team_id`, `season`),
    CONSTRAINT `fk_ts_team` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2. Populate team_seasons with existing teams (assuming current season in teams table)
-- Generate a pseudo-random ID for team_seasons if it doesn't exist
INSERT IGNORE INTO `team_seasons` (`id`, `team_id`, `season`)
SELECT 
    CONCAT('TS_', SUBSTRING(MD5(CONCAT(id, season, RAND())), 1, 15)),
    id, 
    season
FROM `teams`
WHERE `deleted_at` IS NULL;


-- 3. Alter `athlete_teams`
-- Add the new column
ALTER TABLE `athlete_teams` ADD COLUMN `team_season_id` VARCHAR(32) NULL AFTER `team_id`;

-- Update the new column by matching team_id and the current active season
UPDATE `athlete_teams` at
JOIN `teams` t ON at.team_id = t.id
JOIN `team_seasons` ts ON ts.team_id = t.id AND ts.season = t.season
SET at.team_season_id = ts.id;

-- Now that data is migrated, drop the old foreign key and column
ALTER TABLE `athlete_teams` DROP FOREIGN KEY `fk_at_team`;
ALTER TABLE `athlete_teams` DROP PRIMARY KEY;
ALTER TABLE `athlete_teams` DROP COLUMN `team_id`;

-- Make `team_season_id` NOT NULL and add constraints
ALTER TABLE `athlete_teams` MODIFY COLUMN `team_season_id` VARCHAR(32) NOT NULL;
ALTER TABLE `athlete_teams` ADD PRIMARY KEY (`athlete_id`, `team_season_id`);
ALTER TABLE `athlete_teams` ADD CONSTRAINT `fk_at_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;


-- 4. Alter `staff_teams`
-- Add the new column
ALTER TABLE `staff_teams` ADD COLUMN `team_season_id` VARCHAR(32) NULL AFTER `team_id`;

-- Update the new column by matching team_id and the current active season
UPDATE `staff_teams` st
JOIN `teams` t ON st.team_id = t.id
JOIN `team_seasons` ts ON ts.team_id = t.id AND ts.season = t.season
SET st.team_season_id = ts.id;

-- Drop old foreign key (if it exists) and primary key
-- Note: V047 didn't name the FK explicitly for staff_teams, it just has a KEY idx_staff_teams_team
ALTER TABLE `staff_teams` DROP PRIMARY KEY;
ALTER TABLE `staff_teams` DROP COLUMN `team_id`;

-- Make `team_season_id` NOT NULL and add constraints
ALTER TABLE `staff_teams` MODIFY COLUMN `team_season_id` VARCHAR(32) NOT NULL;
ALTER TABLE `staff_teams` ADD PRIMARY KEY (`staff_id`, `team_season_id`);
ALTER TABLE `staff_teams` ADD CONSTRAINT `fk_st_team_season` FOREIGN KEY (`team_season_id`) REFERENCES `team_seasons` (`id`) ON DELETE CASCADE;


-- 5. Drop the season column from the `teams` table
-- Wait, we need to make sure idx_teams_tenant is updated first since it includes season
-- In V005: INDEX idx_teams_tenant (tenant_id, season_id) - but it was renamed to season in V005 (actually it wasn't, wait let me check)
-- It's named `season`, let's just drop it.
-- We must drop the index using it first
ALTER TABLE `teams` DROP INDEX `idx_teams_tenant`;
ALTER TABLE `teams` DROP COLUMN `season`;
ALTER TABLE `teams` ADD INDEX `idx_teams_tenant` (`tenant_id`);
