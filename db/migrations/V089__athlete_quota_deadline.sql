-- V089__athlete_quota_deadline.sql
-- Aggiunge la colonna per la data di scadenza pagamenti quote per le atlete.

ALTER TABLE athletes
ADD COLUMN quota_payment_deadline DATE DEFAULT NULL AFTER quota_foresteria_paid;
