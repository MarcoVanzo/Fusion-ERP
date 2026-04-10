-- Migration V088: Normalize migration file naming
-- This migration only updates the migrations tracking table to reflect
-- renamed files. No schema changes.
--
-- Renaming scheme:
-- V013b → V013_1 (backup_drive, hotfix for V013)
-- V026__invoices.sql stays as V026 (alphabetically first)
-- V026__website_cms.sql → V026_1__website_cms.sql (was duplicate V026)
-- V033b → V033_1 (vehicles, hotfix for V033)
-- V037b → V037_1
-- V039b → V039_1
-- V040b → V040_1
-- V042b → V042_1
-- V046b → V046_1
-- V047b → V047_1
-- V050b → V050_1
-- V062b → V062_1
-- V063b → V063_1
-- V065b → V065_1

-- Update tracking table to match new filenames
UPDATE migrations SET filename = 'V013_1__backup_drive.sql'            WHERE filename = 'V013b__backup_drive.sql';
UPDATE migrations SET filename = 'V026_1__website_cms.sql'             WHERE filename = 'V026__website_cms.sql';
UPDATE migrations SET filename = 'V033_1__vehicles.sql'                WHERE filename = 'V033b__vehicles.sql';
UPDATE migrations SET filename = 'V037_1__whatsapp_inbox.sql'          WHERE filename = 'V037b__whatsapp_inbox.sql';
UPDATE migrations SET filename = 'V039_1__contacts.sql'                WHERE filename = 'V039b__contacts.sql';
UPDATE migrations SET filename = 'V040_1__ec_orders.sql'               WHERE filename = 'V040b__ec_orders.sql';
UPDATE migrations SET filename = 'V042_1__tasks_collation_fix.sql'     WHERE filename = 'V042b__tasks_collation_fix.sql';
UPDATE migrations SET filename = 'V046_1__meta_logs.sql'               WHERE filename = 'V046b__meta_logs.sql';
UPDATE migrations SET filename = 'V047_1__staff_teams.sql'             WHERE filename = 'V047b__staff_teams.sql';
UPDATE migrations SET filename = 'V050_1__network_collab_logo.sql'     WHERE filename = 'V050b__network_collab_logo.sql';
UPDATE migrations SET filename = 'V062_1__teams_gender.sql'            WHERE filename = 'V062b__teams_gender.sql';
UPDATE migrations SET filename = 'V063_1__scouting_add_cognito_id.sql' WHERE filename = 'V063b__scouting_add_cognito_id.sql';
UPDATE migrations SET filename = 'V065_1__societa_sponsors_add_fields.sql' WHERE filename = 'V065b__societa_sponsors_add_fields.sql';
