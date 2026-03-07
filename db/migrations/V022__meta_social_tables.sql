-- V022__meta_social_tables.sql — Social module: Meta OAuth tokens & state table
-- Engine: InnoDB | Charset: utf8mb4_unicode_ci
-- These tables were missing from migrations (previously created manually).

-- ─── META TOKENS (Long-lived Page/IG tokens) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS meta_tokens (
    id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    user_id         VARCHAR(20)   NOT NULL,
    page_id         VARCHAR(100)  NULL,
    ig_account_id   VARCHAR(100)  NULL,
    page_name       VARCHAR(255)  NULL,
    ig_username     VARCHAR(255)  NULL,
    access_token    TEXT          NOT NULL,
    token_type      VARCHAR(30)   NOT NULL DEFAULT 'long_lived',
    expires_at      DATETIME      NULL,
    created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_meta_tokens_user (user_id),
    INDEX idx_meta_tokens_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── META OAUTH STATES (Temporary state tokens for OAuth callback) ────────────
CREATE TABLE IF NOT EXISTS meta_oauth_states (
    token       VARCHAR(64)   NOT NULL,
    user_id     VARCHAR(20)   NOT NULL DEFAULT '0',
    expires_at  DATETIME      NOT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (token),
    INDEX idx_meta_oauth_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
