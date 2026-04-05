-- Migration: V068__fix_societa_sponsors_schema.sql
-- Goal: Fix relationship and sponsorship fields to be textual instead of decimal (which was a typo in V065)

ALTER TABLE societa_sponsors 
MODIFY COLUMN rapporto VARCHAR(255) DEFAULT NULL,
MODIFY COLUMN sponsorizzazione TEXT DEFAULT NULL;

-- Log the fix
-- UPDATE societa_sponsors SET rapporto = NULL, sponsorizzazione = NULL; -- Optional cleanup if old values were garbage
