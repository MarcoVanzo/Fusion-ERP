-- V129__outseason_paypal_columns.sql
-- Add PayPal payment columns to outseason_entries for native payment processing

-- 1. Add payment columns (using safe IF NOT EXISTS pattern)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND COLUMN_NAME = 'payment_status');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE outseason_entries ADD COLUMN payment_status ENUM(''PENDING'',''PAID'',''FAILED'',''REFUNDED'') NOT NULL DEFAULT ''PENDING'' AFTER order_summary',
    'SELECT ''payment_status already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND COLUMN_NAME = 'paypal_order_id');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE outseason_entries ADD COLUMN paypal_order_id VARCHAR(50) NULL AFTER payment_status',
    'SELECT ''paypal_order_id already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND COLUMN_NAME = 'paypal_capture_id');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE outseason_entries ADD COLUMN paypal_capture_id VARCHAR(50) NULL AFTER paypal_order_id',
    'SELECT ''paypal_capture_id already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND COLUMN_NAME = 'payment_method');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE outseason_entries ADD COLUMN payment_method VARCHAR(20) NULL AFTER paypal_capture_id',
    'SELECT ''payment_method already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND COLUMN_NAME = 'paid_at');
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE outseason_entries ADD COLUMN paid_at DATETIME NULL AFTER payment_method',
    'SELECT ''paid_at already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Make cognito_id nullable (entries from native form have no Cognito ID)
ALTER TABLE outseason_entries MODIFY COLUMN cognito_id INT UNSIGNED NULL DEFAULT NULL;

-- 3. Add indexes (safe pattern)
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND INDEX_NAME = 'idx_paypal_order_id');
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE outseason_entries ADD INDEX idx_paypal_order_id (paypal_order_id)',
    'SELECT ''idx_paypal_order_id already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'outseason_entries' AND INDEX_NAME = 'idx_payment_status');
SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE outseason_entries ADD INDEX idx_payment_status (payment_status)',
    'SELECT ''idx_payment_status already exists''');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Discount codes table
CREATE TABLE IF NOT EXISTS outseason_discount_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tenant_id VARCHAR(30) NOT NULL DEFAULT 'TNT_fusion',
  code VARCHAR(50) NOT NULL,
  discount_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00,
  max_uses INT NULL DEFAULT NULL COMMENT 'NULL = illimitato',
  current_uses INT NOT NULL DEFAULT 0,
  season_key VARCHAR(10) NOT NULL DEFAULT '2026',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_code_season (tenant_id, code, season_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Default discount code
INSERT INTO outseason_discount_codes (tenant_id, code, discount_percent, season_key)
VALUES ('TNT_fusion', 'FUSION10', 10.00, '2026')
ON DUPLICATE KEY UPDATE discount_percent = VALUES(discount_percent);
