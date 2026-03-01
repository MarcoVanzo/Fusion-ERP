-- ─── META TOKENS TABLE ───────────────────────────────────────────────────────
-- Stores OAuth tokens for Meta Business (Instagram + Facebook) integration
-- Run this migration on the production database before using the Social module.

CREATE TABLE IF NOT EXISTS meta_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    page_id VARCHAR(100) DEFAULT NULL,
    ig_account_id VARCHAR(100) DEFAULT NULL,
    page_name VARCHAR(255) DEFAULT NULL,
    ig_username VARCHAR(100) DEFAULT NULL,
    access_token TEXT NOT NULL,
    token_type VARCHAR(50) DEFAULT 'long_lived',
    expires_at DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
