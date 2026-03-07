-- V019__password_history.sql
-- Crea la tabella password_history per impedire il riuso delle ultime N password.

CREATE TABLE IF NOT EXISTS password_history (
    id          VARCHAR(20)  NOT NULL,
    user_id     VARCHAR(20)  NOT NULL,
    pwd_hash    VARCHAR(255) NOT NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_pwdhist_user    (user_id),
    INDEX idx_pwdhist_created (created_at),
    CONSTRAINT fk_pwdhist_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
