-- Database Migration V071: Athlete Portal Enhancements
-- Adds support for sub-users and invitations.

-- 1. Add parent_user_id to users to manage hierarchy (up to 2 sub-users)
ALTER TABLE users ADD COLUMN parent_user_id INT DEFAULT NULL;

-- 2. Create sub-users invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
    id VARCHAR(50) PRIMARY KEY,
    inviter_user_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, expired
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (inviter_user_id) REFERENCES users(id)
);

-- 3. Ensure athletes table has user_id if not already present (defensive)
-- Note: SQLite does not support ADD COLUMN IF NOT EXISTS easily without PRAGMA check, 
-- but from our research, it was already there. We add it just in case as a migration step 
-- if this was a fresh DB. But V001__init already had it.

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_users_parent_id ON users(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON user_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON user_invitations(email);
