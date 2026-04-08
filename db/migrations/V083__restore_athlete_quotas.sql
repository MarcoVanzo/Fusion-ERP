-- V083__restore_athlete_quotas.sql
-- Restore flat quota columns to athletes after revert of unification
ALTER TABLE athletes ADD COLUMN quota_iscrizione_rata1 DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE athletes ADD COLUMN quota_iscrizione_rata1_paid TINYINT(1) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN quota_iscrizione_rata2 DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE athletes ADD COLUMN quota_iscrizione_rata2_paid TINYINT(1) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN quota_vestiario DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE athletes ADD COLUMN quota_vestiario_paid TINYINT(1) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN quota_foresteria DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE athletes ADD COLUMN quota_foresteria_paid TINYINT(1) DEFAULT 0;
ALTER TABLE athletes ADD COLUMN quota_trasporti DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE athletes ADD COLUMN quota_trasporti_paid TINYINT(1) DEFAULT 0;
