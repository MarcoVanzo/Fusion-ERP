-- Migration config: VX
-- Description: Rename 'manager' role to 'social media manager'

-- 1. Aggiorna la tabella users per il fallback legacy
UPDATE users 
SET role = 'social media manager' 
WHERE role = 'manager';

-- 2. Aggiorna l'array JSON in tenant_users
-- Usiamo CAST e REPLACE sul testo JSON per convertire l'elemento "manager" in "social media manager"
-- (È sicuro in quanto l'array contiene solo ruoli stringa predefiniti)
UPDATE tenant_users 
SET roles = CAST(REPLACE(CAST(roles AS CHAR), '"manager"', '"social media manager"') AS JSON)
WHERE JSON_CONTAINS(roles, '"manager"');

-- 3. (Opzionale) Fix storico audit_logs
UPDATE audit_logs 
SET role = 'social media manager' 
WHERE role = 'manager';
