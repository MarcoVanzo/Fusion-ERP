-- ─────────────────────────────────────────────────────────────────────────────
-- V047__staff_teams.sql
-- Tabella di raccordo per associare membri dello staff a più squadre
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `staff_teams` (
    `staff_id`    VARCHAR(20) NOT NULL,
    `team_id`     VARCHAR(20) NOT NULL,
    `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`staff_id`, `team_id`),
    KEY `idx_staff_teams_team` (`team_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
