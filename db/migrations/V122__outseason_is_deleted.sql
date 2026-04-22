-- V116: Add is_deleted column to outseason_entries to allow soft-deleting Cognito entries
-- and preventing them from showing up after sync

ALTER TABLE outseason_entries 
ADD COLUMN is_deleted TINYINT(1) NOT NULL DEFAULT 0 AFTER order_summary;

