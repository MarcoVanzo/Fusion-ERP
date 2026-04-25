-- V126: Normalize tappa values for Talent Day
-- All records saved as "Scandicci" or old "19 MAG 2026, Firenze - Savino Del Bene Volley"
-- should be unified under "19 MAG 2026, Firenze 2 - Savino Del Bene Volley"

UPDATE talent_day_entries
SET tappa = '19 MAG 2026, Firenze 2 - Savino Del Bene Volley'
WHERE tappa LIKE '%Scandicci%'
   OR tappa = '19 MAG 2026, Firenze - Savino Del Bene Volley';
