-- V120: Add tenant_id to installments table for direct multi-tenant isolation.
-- Previously, installments relied on JOINing through payment_plans for tenant scoping,
-- leaving direct queries (markOverdueInstallments, payInstallment) unscoped.
--
-- Security Audit P1-01: Cross-tenant writes possible without direct tenant column.
-- Security Audit P2-04: Add FK constraint on plan_id (was missing).

-- 1. Add tenant_id column (nullable initially for backfill)
ALTER TABLE installments
    ADD COLUMN tenant_id VARCHAR(50) NULL AFTER id;

-- 2. Backfill from payment_plans
UPDATE installments i
    JOIN payment_plans pp ON pp.id = i.plan_id
    SET i.tenant_id = pp.tenant_id;

-- 3. Make NOT NULL after backfill
ALTER TABLE installments
    MODIFY COLUMN tenant_id VARCHAR(50) NOT NULL DEFAULT 'TNT_fusion';

-- 4. Add index for tenant-scoped queries
CREATE INDEX idx_installments_tenant ON installments (tenant_id);

-- 5. Add FK constraint on plan_id (P2-04) — only if not already present
-- Check if FK exists and skip if so
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'installments'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
      AND CONSTRAINT_NAME = 'fk_installments_plan');

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE installments ADD CONSTRAINT fk_installments_plan FOREIGN KEY (plan_id) REFERENCES payment_plans(id) ON DELETE CASCADE',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
