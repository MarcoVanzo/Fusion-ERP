-- V047__cleanup_duplicate_ec_orders.sql
-- Removes duplicate orders inserted with empty tenant_id after the introduction of multi-tenancy.
-- Safe to do because the correct records have a proper tenant_id and any subsequent sync will update the correct row.

DELETE FROM ec_orders WHERE tenant_id = '' OR tenant_id IS NULL;
