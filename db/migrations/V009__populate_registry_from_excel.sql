-- V009__populate_registry_from_excel.sql
-- Popola i nuovi campi anagrafica dagli dati Excel già importati.
-- Prerequisito: V008__athlete_registry_fields.sql già eseguita.

-- 1. Copia il campo 'Cellulare' (parent_phone) → phone per tutti gli atleti
--    Nel file Excel il campo 'Cellulare' è stato importato come parent_phone,
--    ma si tratta del cellulare dell'atleta/famiglia → lo copiamo anche in phone.
UPDATE athletes
SET phone = parent_phone
WHERE parent_phone IS NOT NULL
  AND phone IS NULL
  AND deleted_at IS NULL;

-- 2. Verifica: mostra lo stato dell'anagrafica dopo il popolamento
SELECT
    id,
    first_name,
    last_name,
    full_name,
    birth_date,
    residence_address,
    phone,
    email,
    identity_document,
    fiscal_code,
    medical_cert_expires_at,
    role,
    federal_id,
    birth_place,
    residence_city
FROM athletes
WHERE deleted_at IS NULL
ORDER BY full_name;
