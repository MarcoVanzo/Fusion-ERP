-- V082__unify_quotas_and_payments.sql
-- Remove flat quota columns from athletes to standardize on payment_plans
ALTER TABLE athletes DROP COLUMN quota_iscrizione_rata1;
ALTER TABLE athletes DROP COLUMN quota_iscrizione_rata1_paid;
ALTER TABLE athletes DROP COLUMN quota_iscrizione_rata2;
ALTER TABLE athletes DROP COLUMN quota_iscrizione_rata2_paid;
ALTER TABLE athletes DROP COLUMN quota_vestiario;
ALTER TABLE athletes DROP COLUMN quota_vestiario_paid;
ALTER TABLE athletes DROP COLUMN quota_foresteria;
ALTER TABLE athletes DROP COLUMN quota_foresteria_paid;
ALTER TABLE athletes DROP COLUMN quota_trasporti;
ALTER TABLE athletes DROP COLUMN quota_trasporti_paid;

-- Add a title column to installments for explicit quota naming
ALTER TABLE installments ADD COLUMN title VARCHAR(100) NULL AFTER plan_id;
