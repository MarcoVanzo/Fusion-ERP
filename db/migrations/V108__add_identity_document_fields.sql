-- V108__add_identity_document_fields.sql
-- Adds identity document field to athletes and staff units for Rooming List generation.

ALTER TABLE athletes ADD COLUMN identity_document VARCHAR(255) NULL AFTER image_release_consent;
ALTER TABLE staff_members ADD COLUMN identity_document VARCHAR(255) NULL AFTER notes;
