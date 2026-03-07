-- V021__password_reset_token.sql
-- Aggiunge supporto per reset password via email (forgot password flow)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_reset_token     VARCHAR(64)  NULL DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS password_reset_expires_at DATETIME    NULL DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_users_pwd_reset_token
    ON users (password_reset_token);
