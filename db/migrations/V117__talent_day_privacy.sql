-- V117: Aggiunta campo consenso privacy per le registrazioni Talent Day

ALTER TABLE talent_day_entries
ADD COLUMN privacy_consent TINYINT(1) NOT NULL DEFAULT 0 AFTER email_genitore;
