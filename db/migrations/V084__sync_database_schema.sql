-- V084__sync_database_schema.sql
-- Synchronize database schema with current codebase requirements

-- 1. Create missing eCommerce products table
CREATE TABLE IF NOT EXISTS `ec_products` (
    `id`             INT AUTO_INCREMENT PRIMARY KEY,
    `nome`           VARCHAR(255) NOT NULL,
    `prezzo`         DECIMAL(10,2) DEFAULT 0.00,
    `categoria`      VARCHAR(100),
    `descrizione`    TEXT,
    `immagineBase64` LONGTEXT,
    `immagineMimeType` VARCHAR(50),
    `immagineUrl`    VARCHAR(500),
    `disponibile`    TINYINT(1) DEFAULT 1,
    `importatoIl`    DATETIME,
    `modificatoIl`   DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create missing vehicles table
CREATE TABLE IF NOT EXISTS `vehicles` (
    `id`            VARCHAR(20)  NOT NULL PRIMARY KEY,
    `model`         VARCHAR(255) NOT NULL,
    `license_plate` VARCHAR(20),
    `seats`         TINYINT      NOT NULL DEFAULT 5,
    `status`        VARCHAR(30)  DEFAULT 'active',
    `notes`         TEXT,
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add vehicle_id to transports table
-- Standard ALTER TABLE (will fail if already exists, but that's better than syntax error)
-- We assume it doesn't exist yet since deployment failed.
ALTER TABLE `transports` ADD COLUMN `vehicle_id` VARCHAR(20) NULL AFTER `driver_id`;

-- 4. Add constraint for vehicle_id
ALTER TABLE `transports` ADD CONSTRAINT `fk_transports_vehicle` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL;

-- 5. Final check for scouting_athletes
ALTER TABLE `scouting_athletes` ADD COLUMN `cognito_form` VARCHAR(50) NULL AFTER `cognito_id`;
