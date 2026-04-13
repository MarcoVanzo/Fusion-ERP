-- V115: Fix tenant_id assignment for eCommerce products and orders
-- During V112 and V046, the default tenant assigned might have been incorrect 
-- (e.g. TNT_default instead of TNT_fusion) or left empty.

-- 1. Fix ec_products
UPDATE ec_products 
SET tenant_id = 'TNT_fusion' 
WHERE tenant_id = 'TNT_default' OR tenant_id = '' OR tenant_id IS NULL;

-- 2. Fix ec_orders
UPDATE ec_orders 
SET tenant_id = 'TNT_fusion' 
WHERE tenant_id = 'TNT_default' OR tenant_id = '' OR tenant_id IS NULL;
