-- V080__athlete_quota_trasporti.sql
ALTER TABLE athletes ADD COLUMN quota_trasporti DECIMAL(10,2) DEFAULT NULL AFTER quota_foresteria_paid;
ALTER TABLE athletes ADD COLUMN quota_trasporti_paid TINYINT(1) DEFAULT 0 AFTER quota_trasporti;
