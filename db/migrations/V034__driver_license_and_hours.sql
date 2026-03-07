-- V033__driver_license_and_hours.sql — Aggiunta campi Patente e Ore Lavorate per Autisti
-- Dependencies: V029__drivers.sql

ALTER TABLE drivers 
ADD COLUMN license_file VARCHAR(255) NULL AFTER license_number,
ADD COLUMN hourly_rate DECIMAL(10,2) NULL AFTER license_file;
