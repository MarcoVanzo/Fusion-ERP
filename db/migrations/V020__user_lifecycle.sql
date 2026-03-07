-- V020__user_lifecycle.sql
-- Compatibile MySQL 5.7+ (senza IF NOT EXISTS per ALTER/INDEX)
-- Aggiunge status, blocked, verification_token, token_expires_at, avatar_path

-- ─── status ────────────────────────────────────────────────────────────────
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'status') = 0,
    'ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''Attivo'' COMMENT ''Invitato | Attivo | Disattivato''',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── blocked ────────────────────────────────────────────────────────────────
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'blocked') = 0,
    'ALTER TABLE users ADD COLUMN blocked TINYINT(1) NOT NULL DEFAULT 0',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── verification_token ─────────────────────────────────────────────────────
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'verification_token') = 0,
    'ALTER TABLE users ADD COLUMN verification_token VARCHAR(255) NULL DEFAULT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── token_expires_at ───────────────────────────────────────────────────────
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'token_expires_at') = 0,
    'ALTER TABLE users ADD COLUMN token_expires_at DATETIME NULL DEFAULT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── avatar_path ────────────────────────────────────────────────────────────
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'avatar_path') = 0,
    'ALTER TABLE users ADD COLUMN avatar_path VARCHAR(500) NULL DEFAULT NULL',
    'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ─── Allinea status agli utenti esistenti ───────────────────────────────────
UPDATE users SET status = 'Attivo'      WHERE is_active = 1;
UPDATE users SET status = 'Disattivato' WHERE is_active = 0;

-- ─── Index (il runner ignora "Duplicate key name") ───────────────────────────
CREATE INDEX idx_users_status  ON users(status);
CREATE INDEX idx_users_blocked ON users(blocked);
CREATE INDEX idx_users_token   ON users(verification_token(64));
