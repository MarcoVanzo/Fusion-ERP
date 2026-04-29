-- V130: Add 'saldo' column to outseason_entries
-- Saldo = remaining balance after deposit (caparra) is paid
-- Auto-populated when bank statement PDF is verified via AI

CALL safe_add_column('outseason_entries', 'saldo', "DECIMAL(10,2) NULL COMMENT 'Saldo residuo dopo caparra'");
