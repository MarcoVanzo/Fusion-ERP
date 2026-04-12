-- V107__tournament_expenses.sql
-- ═══════════════════════════════════════════════════════════════════════════════
-- Fusion ERP — Feature: Tournament Expenses
-- Adds a table to track tournament specific costs and calculate net profit.
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS `tournament_expenses` (
    `id` VARCHAR(64) PRIMARY KEY,
    `event_id` VARCHAR(64) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_tournament_expenses_event` (`event_id`),
    CONSTRAINT `fk_tournament_expenses_event` FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
