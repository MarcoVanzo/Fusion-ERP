-- V079__injury_features.sql
-- Adds tables for injury follow-up visits and related medical documents

CREATE TABLE IF NOT EXISTS `injury_followups` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` VARCHAR(20) NOT NULL,
    `injury_id` VARCHAR(20) NOT NULL,
    `visit_date` DATE NOT NULL,
    `practitioner` VARCHAR(150),
    `notes` TEXT,
    `outcome` VARCHAR(255),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`injury_id`) REFERENCES `injury_records`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `injury_documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tenant_id` VARCHAR(20) NOT NULL,
    `injury_id` VARCHAR(20) NOT NULL,
    `document_title` VARCHAR(255) NOT NULL,
    `document_type` VARCHAR(100),
    `file_path` VARCHAR(500) NOT NULL,
    `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`injury_id`) REFERENCES `injury_records`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
