-- Migration: create meta_oauth_states table for cross-request OAuth token storage
CREATE TABLE IF NOT EXISTS meta_oauth_states (
    token      VARCHAR(64)  NOT NULL PRIMARY KEY,
    user_id    INT          NOT NULL,
    expires_at DATETIME     NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
