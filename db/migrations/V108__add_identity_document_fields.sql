-- V108__add_identity_document_fields.sql
-- Force safe addition to avoid deployment blocks if columns exist.

-- MySQL 8.0.11+ / MariaDB 10.2.2+ support IF NOT EXISTS in ALTER TABLE
-- Since Aruba environment might vary, we can use a procedure but IF NOT EXISTS is cleaner if supported.
-- Let's try IF NOT EXISTS first.

ALTER TABLE athletes ADD COLUMN IF NOT EXISTS identity_document VARCHAR(255) NULL AFTER image_release_consent;
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS identity_document VARCHAR(255) NULL AFTER notes;
