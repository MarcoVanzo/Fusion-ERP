-- V014__roles_migration.sql
-- Migrates users with old role names to the new 5-role flat system:
--   readonly     → atleta
--   operator     → operatore
--   manager      → manager   (same name, kept)
--   admin        → admin     (same name, kept)
-- allenatore is a new role — assign manually via the admin panel.
--
-- Run this ONCE after deploying the new role system.
-- Check the results before committing by running the SELECT first.

-- Preview (run this first):
-- SELECT id, email, role FROM users WHERE role NOT IN ('atleta','allenatore','operatore','manager','admin');

-- Migrate 'readonly' → 'atleta'
UPDATE users SET role = 'atleta'    WHERE role = 'readonly';

-- Migrate 'operator' → 'operatore' (old English name)
UPDATE users SET role = 'operatore' WHERE role = 'operator';

-- 'operator_read', 'operator_write' → 'operatore' (from previous interim system)
UPDATE users SET role = 'operatore' WHERE role IN ('operator_read', 'operator_write');

-- 'manager_read', 'manager_write' → 'manager' (from previous interim system)
UPDATE users SET role = 'manager'   WHERE role IN ('manager_read', 'manager_write');

-- Verify no unknown roles remain:
-- SELECT DISTINCT role FROM users WHERE role NOT IN ('atleta','allenatore','operatore','manager','admin');
