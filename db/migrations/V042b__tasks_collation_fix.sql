-- V042__tasks_collation_fix.sql
-- Fix collation mismatch between tasks, task_logs and users tables

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE `tasks` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `task_logs` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
