-- V029__drivers.sql — Manual Driver Management
-- Dependencies: V001__init.sql

CREATE TABLE IF NOT EXISTS drivers (
    id              VARCHAR(20)  NOT NULL,     -- e.g. DRV_d4f7a1b3
    full_name       VARCHAR(200) NOT NULL,
    phone           VARCHAR(50)  NULL,
    license_number  VARCHAR(50)  NULL,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    notes           TEXT         NULL,
    created_by      VARCHAR(20)  NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at      DATETIME     NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_drivers_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add driver_id to carpool_routes to allow selecting from manual drivers
ALTER TABLE carpool_routes 
ADD COLUMN driver_id VARCHAR(20) NULL AFTER driver_athlete_id,
MODIFY COLUMN driver_user_id VARCHAR(20) NULL,
ADD CONSTRAINT fk_carpool_manual_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
