-- V006__add_athlete_fields.sql — Aggiunta campi per atleti importati da Excel
-- Administrator configures the DB from Aruba panel

ALTER TABLE athletes ADD COLUMN residence_address VARCHAR(255) NULL;
ALTER TABLE athletes ADD COLUMN identity_document VARCHAR(50) NULL;
ALTER TABLE athletes ADD COLUMN fiscal_code VARCHAR(16) NULL;
ALTER TABLE athletes ADD COLUMN registration_form_signed TINYINT(1) NULL;
ALTER TABLE athletes ADD COLUMN shirt_size VARCHAR(10) NULL;
ALTER TABLE athletes ADD COLUMN medical_cert_expires_at DATE NULL;
ALTER TABLE athletes ADD COLUMN medical_cert_type VARCHAR(20) NULL;
ALTER TABLE athletes ADD COLUMN privacy_consent_signed TINYINT(1) NULL;
ALTER TABLE athletes ADD COLUMN federal_id VARCHAR(50) NULL;
ALTER TABLE athletes ADD COLUMN shoe_size VARCHAR(10) NULL;
