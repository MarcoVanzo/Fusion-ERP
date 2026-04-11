-- V097__add_receipt_numbers.sql
-- Add receipt_year and receipt_number to transactions table for progressive ASD receipts
-- NOTE: This migration was originally named V086__add_receipt_numbers.sql
-- These columns already exist in production, so this migration is a no-op.
-- The runner marks it as executed to keep the tracking table in sync.

SELECT 1;
