-- V035__drop_unused_tables.sql
-- Rimozione delle tabelle obsolete ("payments_invoices", "push_subscriptions", "user_relationships")

DROP TABLE IF EXISTS payments_invoices;
DROP TABLE IF EXISTS push_subscriptions;
DROP TABLE IF EXISTS user_relationships;
