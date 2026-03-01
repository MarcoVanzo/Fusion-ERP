-- V008__athlete_registry_fields.sql — Campi anagrafica atleta completa
-- Aggiunge: first_name, last_name, birth_place, residence_city, phone, email
-- Converte full_name in colonna GENERATED per backward compatibility

-- 1. Aggiunta nuove colonne
ALTER TABLE athletes ADD COLUMN first_name VARCHAR(80) NULL AFTER full_name;
ALTER TABLE athletes ADD COLUMN last_name VARCHAR(80) NULL AFTER first_name;
ALTER TABLE athletes ADD COLUMN birth_place VARCHAR(150) NULL AFTER birth_date;
ALTER TABLE athletes ADD COLUMN residence_city VARCHAR(100) NULL AFTER residence_address;
ALTER TABLE athletes ADD COLUMN phone VARCHAR(30) NULL AFTER parent_phone;
ALTER TABLE athletes ADD COLUMN email VARCHAR(150) NULL AFTER phone;

-- 2. Popola first_name / last_name da full_name esistente
UPDATE athletes
SET first_name = SUBSTRING_INDEX(full_name, ' ', 1),
    last_name  = TRIM(SUBSTRING(full_name FROM LOCATE(' ', full_name) + 1))
WHERE full_name IS NOT NULL AND first_name IS NULL;

-- 3. Converti full_name in colonna GENERATED (STORED, per poter usare indici)
ALTER TABLE athletes
    DROP COLUMN full_name,
    ADD COLUMN full_name VARCHAR(150) GENERATED ALWAYS AS (CONCAT(COALESCE(first_name,''), ' ', COALESCE(last_name,''))) STORED AFTER last_name;

-- 4. Indice su fiscal_code per ricerche rapide
ALTER TABLE athletes ADD INDEX idx_athletes_fiscal_code (fiscal_code);

-- 5. Indice su email per ricerche rapide
ALTER TABLE athletes ADD INDEX idx_athletes_email (email);
