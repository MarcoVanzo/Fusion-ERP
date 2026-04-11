-- V101: Add tenant_id to tasks and task_logs for multi-tenant isolation
-- Part of P1-04 security hardening

-- 1. Add tenant_id column to tasks (nullable initially for backfill)
ALTER TABLE `tasks` ADD COLUMN `tenant_id` VARCHAR(20) DEFAULT NULL AFTER `id`;

-- 2. Backfill tenant_id from the creator's user record
UPDATE `tasks` t
  JOIN `users` u ON u.id = t.user_id
SET t.tenant_id = u.tenant_id
WHERE t.tenant_id IS NULL;

-- 3. Add index for tenant scoping
ALTER TABLE `tasks` ADD INDEX `idx_tasks_tenant` (`tenant_id`);

-- 4. Add tenant_id column to task_logs
ALTER TABLE `task_logs` ADD COLUMN `tenant_id` VARCHAR(20) DEFAULT NULL AFTER `id`;

-- 5. Backfill task_logs tenant_id from task
UPDATE `task_logs` tl
  JOIN `tasks` t ON t.id = tl.task_id
SET tl.tenant_id = t.tenant_id
WHERE tl.tenant_id IS NULL;

-- 6. Add index for tenant scoping on task_logs
ALTER TABLE `task_logs` ADD INDEX `idx_task_logs_tenant` (`tenant_id`);
