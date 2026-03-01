-- V010__outseason_verifications.sql — Out Season AI Payment Verification Results
-- Dependencies: V001__init.sql (users table)

CREATE TABLE IF NOT EXISTS outseason_verifications (
    id                      INT UNSIGNED     NOT NULL AUTO_INCREMENT,
    season_key              VARCHAR(10)      NOT NULL COMMENT 'e.g. 2026',
    entry_name              VARCHAR(150)     NOT NULL COMMENT 'Full name from Cognito Forms',
    found                   TINYINT(1)       NOT NULL DEFAULT 0,
    confidence              ENUM('high','medium','low') NULL,
    transaction_date        VARCHAR(20)      NULL     COMMENT 'DD/MM/YYYY as returned by Gemini',
    transaction_amount      DECIMAL(10,2)    NULL,
    transaction_description TEXT             NULL,
    notes                   TEXT             NULL,
    verified_at             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    verified_by             VARCHAR(20)      NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_season_entry (season_key, entry_name),
    INDEX idx_osv_season (season_key),
    CONSTRAINT fk_osv_user FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
