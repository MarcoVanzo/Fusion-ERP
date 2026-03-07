-- V016__audit_log_role.sql
-- Adds `role` snapshot column to audit_logs (MySQL 5.x compatible)

SET @dbname = DATABASE();
SET @col = 'role';
SET @query = IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME='audit_logs' AND COLUMN_NAME=@col) > 0,
  'SELECT "role: ALREADY_EXISTS" AS result',
  'ALTER TABLE audit_logs ADD COLUMN role VARCHAR(50) NULL AFTER username'
);
PREPARE stmt FROM @query; EXECUTE stmt; DEALLOCATE PREPARE stmt;
