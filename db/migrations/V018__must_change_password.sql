-- V018__must_change_password.sql
-- Compatibile MySQL 5.7+ (senza IF NOT EXISTS per ALTER/INDEX)

-- Aggiunge must_change_password solo se non esiste
SET @sql = IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'must_change_password') = 0,
    'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 COMMENT "Se 1 utente deve cambiare la password al prossimo login"',
    'SELECT 1 -- already exists'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index (ignorato se duplicato)
CREATE INDEX idx_users_must_change ON users(must_change_password);
