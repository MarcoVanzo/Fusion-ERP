-- V043__ecommerce_permissions.sql
-- Aggiunge il permesso 'ecommerce' (read/write) al JSON dei ruoli
-- di tutti gli utenti attivi in tenant_users.
--
-- Il campo tenant_users.roles è un JSON object: {"athletes":"write","finance":"read",...}
-- JSON_SET aggiunge/sovrascrive la chiave "ecommerce" senza toccare le altre.

UPDATE tenant_users
SET roles = JSON_SET(
    COALESCE(roles, '{}'),
    '$.ecommerce', 'write'
)
WHERE roles IS NOT NULL;

-- Per gli utenti senza entry in tenant_users, il sistema Auth
-- restituisce permissions=[] (array vuoto) → blocco 403.
-- Gli admin bypassano automaticamente (non serve aggiornare).

-- Verifica post-migrazione:
-- SELECT user_id, JSON_EXTRACT(roles, '$.ecommerce') as ecommerce_perm FROM tenant_users;
