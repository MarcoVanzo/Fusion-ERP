-- V031__transports_driver.sql — Link transports to manual drivers
-- Dependencies: V007__transports.sql, V029__drivers.sql

ALTER TABLE transports
  ADD COLUMN driver_id VARCHAR(20) NULL AFTER team_id,
  ADD CONSTRAINT fk_transports_driver FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
