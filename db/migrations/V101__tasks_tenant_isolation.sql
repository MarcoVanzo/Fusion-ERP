-- V101: Add tenant_id to tasks and task_logs for multi-tenant isolation
-- Part of P1-04 security hardening
-- Idempotent: uses DROP/CREATE PROCEDURE pattern for MySQL DDL safety

DELIMITER //
CREATE PROCEDURE _migration_v101()
BEGIN
    -- 1. Add tenant_id to tasks if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND COLUMN_NAME = 'tenant_id'
    ) THEN
        ALTER TABLE `tasks` ADD COLUMN `tenant_id` VARCHAR(20) DEFAULT NULL AFTER `id`;
    END IF;

    -- 2. Backfill from tenant_users pivot table
    UPDATE `tasks` t
      JOIN `tenant_users` tu ON tu.user_id = t.user_id
    SET t.tenant_id = tu.tenant_id
    WHERE t.tenant_id IS NULL;

    -- 3. Add index if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tasks' AND INDEX_NAME = 'idx_tasks_tenant'
    ) THEN
        ALTER TABLE `tasks` ADD INDEX `idx_tasks_tenant` (`tenant_id`);
    END IF;

    -- 4. Add tenant_id to task_logs if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_logs' AND COLUMN_NAME = 'tenant_id'
    ) THEN
        ALTER TABLE `task_logs` ADD COLUMN `tenant_id` VARCHAR(20) DEFAULT NULL AFTER `id`;
    END IF;

    -- 5. Backfill task_logs from tasks
    UPDATE `task_logs` tl
      JOIN `tasks` t ON t.id = tl.task_id
    SET tl.tenant_id = t.tenant_id
    WHERE tl.tenant_id IS NULL;

    -- 6. Add index if not exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'task_logs' AND INDEX_NAME = 'idx_task_logs_tenant'
    ) THEN
        ALTER TABLE `task_logs` ADD INDEX `idx_task_logs_tenant` (`tenant_id`);
    END IF;
END//
DELIMITER ;

CALL _migration_v101();
DROP PROCEDURE IF EXISTS _migration_v101;
