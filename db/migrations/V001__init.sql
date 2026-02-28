-- V001__init.sql — Core: users, login_attempts, audit_logs
-- Engine: InnoDB | Charset: utf8mb4_unicode_ci

CREATE DATABASE IF NOT EXISTS fusion_erp
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE fusion_erp;

-- ─── USERS ────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id                   VARCHAR(20)  NOT NULL,           -- e.g. USR_a3f8b2c1
    email                VARCHAR(255) NOT NULL,
    pwd_hash             VARCHAR(255) NOT NULL,           -- PASSWORD_BCRYPT cost 12
    role                 ENUM('admin','manager','operator','readonly') NOT NULL DEFAULT 'readonly',
    full_name            VARCHAR(150) NOT NULL,
    phone                VARCHAR(30)  NULL,
    avatar_path          VARCHAR(500) NULL,
    password_changed_at  DATETIME     NULL,               -- null = never changed
    last_login_at        DATETIME     NULL,
    is_active            TINYINT(1)   NOT NULL DEFAULT 1,
    deleted_at           DATETIME     NULL,               -- soft delete
    created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_deleted_at (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── LOGIN ATTEMPTS (Rate Limiting) ───────────────────────────────────────────
CREATE TABLE login_attempts (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    ip_address   VARCHAR(45)  NOT NULL,                  -- IPv4 + IPv6
    email        VARCHAR(255) NULL,
    success      TINYINT(1)   NOT NULL DEFAULT 0,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_login_attempts_ip_ts (ip_address, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── AUDIT LOGS ───────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    user_id         VARCHAR(20)  NULL,
    action          VARCHAR(50)  NOT NULL,               -- e.g. INSERT, UPDATE, DELETE
    table_name      VARCHAR(100) NOT NULL,
    record_id       VARCHAR(20)  NULL,
    before_snapshot JSON         NULL,
    after_snapshot  JSON         NULL,
    ip_address      VARCHAR(45)  NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── SEED: Default admin user ─────────────────────────────────────────────────
-- Password: FusionAdmin2026! (BCRYPT cost 12 — CHANGE IMMEDIATELY)
INSERT INTO users (id, email, pwd_hash, role, full_name, password_changed_at)
VALUES (
    'USR_admin0001',
    'admin@fusionerp.it',
    '$2y$12$Vs4z2vXLe5gN1qRkQl7kxuBb7kVh2rYMz4NbM3v9fz.j5eB5/X4nO',
    'admin',
    'System Administrator',
    NULL
);
