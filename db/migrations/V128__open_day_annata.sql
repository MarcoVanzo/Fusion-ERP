-- V128: Add annata (edition year) to Open Day entries
-- Allows distinguishing registrations by year (e.g. 2026, 2027, etc.)

ALTER TABLE open_day_entries
    ADD COLUMN annata SMALLINT UNSIGNED NOT NULL DEFAULT 2026
        COMMENT 'Edition year of the Open Day event'
    AFTER tenant_id;

-- Index for fast filtering by year
CREATE INDEX idx_od_annata ON open_day_entries (tenant_id, annata);
