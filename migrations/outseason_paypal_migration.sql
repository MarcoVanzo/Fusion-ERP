-- ═══════════════════════════════════════════════════════════════════
-- OutSeason Native Form + PayPal Integration — Database Migration
-- Run this on the Fusion ERP MySQL database
-- ═══════════════════════════════════════════════════════════════════

-- 1. Add payment columns to outseason_entries
ALTER TABLE outseason_entries
  ADD COLUMN payment_status ENUM('PENDING','PAID','FAILED','REFUNDED','AWAITING_PAYMENT') NOT NULL DEFAULT 'PENDING' AFTER order_summary,
  ADD COLUMN paypal_order_id VARCHAR(50) NULL AFTER payment_status,
  ADD COLUMN paypal_capture_id VARCHAR(50) NULL AFTER paypal_order_id,
  ADD COLUMN payment_method VARCHAR(20) NULL COMMENT 'PAYPAL|CARD|BONIFICO' AFTER paypal_capture_id,
  ADD COLUMN paid_at DATETIME NULL AFTER payment_method;

-- 2. Make cognito_id nullable (preserve historical data)
ALTER TABLE outseason_entries
  MODIFY COLUMN cognito_id INT NULL DEFAULT NULL;

-- 3. Index on paypal_order_id for fast lookup during capture
ALTER TABLE outseason_entries
  ADD INDEX idx_paypal_order_id (paypal_order_id);

-- 4. Index on payment_status for dashboard queries
ALTER TABLE outseason_entries
  ADD INDEX idx_payment_status (payment_status);

-- 5. Discount codes table
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

-- 6. Insert a default 10% discount code for testing
INSERT INTO outseason_discount_codes (tenant_id, code, discount_percent, season_key)
VALUES ('TNT_fusion', 'FUSION10', 10.00, '2026')
ON DUPLICATE KEY UPDATE discount_percent = VALUES(discount_percent);
