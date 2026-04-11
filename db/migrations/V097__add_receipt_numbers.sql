-- V086__add_receipt_numbers.sql
-- Add receipt_year and receipt_number to transactions table for progressive ASD receipts

ALTER TABLE transactions
ADD COLUMN receipt_year INT NULL AFTER reference,
ADD COLUMN receipt_number INT NULL AFTER receipt_year,
ADD UNIQUE KEY uq_tx_receipt (receipt_year, receipt_number);

-- Ensure installments can hold a receipt path up to 500 characters
ALTER TABLE installments
MODIFY COLUMN receipt_path VARCHAR(500) NULL;
