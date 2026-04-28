-- V129__outseason_paypal_columns.sql
-- Add PayPal payment columns to outseason_entries for native payment processing
-- Uses safe_add_column procedure (created in V085)

CALL safe_add_column('outseason_entries', 'payment_status', "ENUM('PENDING','PAID','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING'");
CALL safe_add_column('outseason_entries', 'paypal_order_id', "VARCHAR(50) NULL");
CALL safe_add_column('outseason_entries', 'paypal_capture_id', "VARCHAR(50) NULL");
CALL safe_add_column('outseason_entries', 'payment_method', "VARCHAR(20) NULL");
CALL safe_add_column('outseason_entries', 'paid_at', "DATETIME NULL");

-- Make cognito_id nullable (entries from native form have no Cognito ID)
ALTER TABLE outseason_entries MODIFY COLUMN cognito_id INT UNSIGNED NULL DEFAULT NULL;

-- Discount codes table
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

-- Default discount code
INSERT INTO outseason_discount_codes (tenant_id, code, discount_percent, season_key)
VALUES ('TNT_fusion', 'FUSION10', 10.00, '2026')
ON DUPLICATE KEY UPDATE discount_percent = VALUES(discount_percent);
