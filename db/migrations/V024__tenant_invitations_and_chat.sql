-- V024__tenant_invitations_and_chat.sql
-- Adds: tenant invitations table + chat channels/messages tables
-- Dependencies: V005__saas_core.sql, V023__tenant_settings.sql

-- ─── TENANT INVITATIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_invitations (
    id          VARCHAR(20)  NOT NULL,
    tenant_id   VARCHAR(20)  NOT NULL,
    email       VARCHAR(255) NOT NULL,
    roles       JSON         NOT NULL,            -- e.g. ["allenatore", "manager"]
    invited_by  VARCHAR(20)  NULL,
    status      VARCHAR(30)  NOT NULL DEFAULT 'pending',  -- pending, accepted, expired, revoked
    token       VARCHAR(64)  NULL,                -- secure token for invite link
    accepted_at DATETIME     NULL,
    expires_at  DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_invites_tenant (tenant_id),
    INDEX idx_invites_email (email),
    INDEX idx_invites_token (token),
    INDEX idx_invites_status (status),
    CONSTRAINT fk_invites_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_invites_user   FOREIGN KEY (invited_by) REFERENCES users(id)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── CHAT CHANNELS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_channels (
    id          VARCHAR(20)  NOT NULL,
    tenant_id   VARCHAR(20)  NOT NULL,
    team_id     VARCHAR(20)  NULL,               -- NULL = canale a livello società
    name        VARCHAR(100) NOT NULL,
    type        VARCHAR(20)  NOT NULL DEFAULT 'team',  -- team, staff, parents, direct, general
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_by  VARCHAR(20)  NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_channels_tenant (tenant_id),
    INDEX idx_channels_team (team_id),
    INDEX idx_channels_type (type),
    CONSTRAINT fk_channels_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
    CONSTRAINT fk_channels_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── CHAT CHANNEL MEMBERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_channel_members (
    channel_id  VARCHAR(20) NOT NULL,
    user_id     VARCHAR(20) NOT NULL,
    role        VARCHAR(20) NOT NULL DEFAULT 'member',  -- admin, member
    muted       TINYINT(1)  NOT NULL DEFAULT 0,
    last_read_at DATETIME   NULL,
    joined_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (channel_id, user_id),
    CONSTRAINT fk_chanmem_channel FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE,
    CONSTRAINT fk_chanmem_user    FOREIGN KEY (user_id)    REFERENCES users(id)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── CHAT MESSAGES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id          VARCHAR(20) NOT NULL,
    channel_id  VARCHAR(20) NOT NULL,
    user_id     VARCHAR(20) NOT NULL,
    content     TEXT        NOT NULL,
    type        VARCHAR(20) NOT NULL DEFAULT 'text',   -- text, image, file, system, event
    metadata    JSON        NULL,                      -- file URL, image dimensions, etc.
    is_edited   TINYINT(1)  NOT NULL DEFAULT 0,
    deleted_at  DATETIME    NULL,
    created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_messages_channel_time (channel_id, created_at),
    INDEX idx_messages_user (user_id),
    CONSTRAINT fk_messages_channel FOREIGN KEY (channel_id) REFERENCES chat_channels(id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_user    FOREIGN KEY (user_id)    REFERENCES users(id)          ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── PUSH NOTIFICATION SUBSCRIPTIONS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id          VARCHAR(20)  NOT NULL,
    user_id     VARCHAR(20)  NOT NULL,
    endpoint    VARCHAR(500) NOT NULL,
    p256dh_key  VARCHAR(200) NOT NULL,
    auth_key    VARCHAR(100) NOT NULL,
    user_agent  VARCHAR(300) NULL,
    is_active   TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_push_user (user_id),
    UNIQUE KEY uq_push_endpoint (endpoint(191)),
    CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
