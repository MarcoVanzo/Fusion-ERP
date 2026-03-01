-- V011__gyms.sql
-- Creates the gyms table used by the Transport module to store gym/venue destinations.

CREATE TABLE IF NOT EXISTS gyms (
    id           VARCHAR(16)   NOT NULL PRIMARY KEY,
    name         VARCHAR(255)  NOT NULL,
    address      TEXT          DEFAULT NULL,
    lat          DECIMAL(10,7) DEFAULT NULL,
    lng          DECIMAL(10,7) DEFAULT NULL,
    created_by   VARCHAR(36)   NOT NULL,
    created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
