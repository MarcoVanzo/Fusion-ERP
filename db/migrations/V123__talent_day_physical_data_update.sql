ALTER TABLE talent_day_entries
DROP COLUMN peso,
DROP COLUMN sit_and_reach,
DROP COLUMN reach_2,
DROP COLUMN cmj;

ALTER TABLE talent_day_entries
CHANGE COLUMN salto_rincorsa salto_rincorsa_1 DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN salto_rincorsa_2 DECIMAL(5,2) DEFAULT NULL AFTER salto_rincorsa_1,
ADD COLUMN salto_rincorsa_3 DECIMAL(5,2) DEFAULT NULL AFTER salto_rincorsa_2;
