-- Database Migration V032: VALD Performance Integration
-- Fusion ERP v1.0

CREATE TABLE IF NOT EXISTS `vald_test_results` (
    `id` VARCHAR(50) NOT NULL,
    `tenant_id` VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL,
    `athlete_id` VARCHAR(20) COLLATE utf8mb4_unicode_ci NOT NULL,
    `test_id` VARCHAR(100) NOT NULL,
    `test_date` DATETIME NOT NULL,
    `test_type` VARCHAR(100) NOT NULL,
    `metrics` JSON DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uniq_test_id` (`test_id`),
    KEY `idx_athlete` (`athlete_id`),
    KEY `idx_tenant` (`tenant_id`),
    CONSTRAINT `fk_vald_athlete` FOREIGN KEY (`athlete_id`) 
        REFERENCES `athletes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
