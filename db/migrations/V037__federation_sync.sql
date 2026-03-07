-- V037__federation_sync.sql — Local sync for FIPAV championships
-- Stores championships, matches, and standings scraped from external portals.

-- ─── FEDERATION CHAMPIONSHIPS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS federation_championships (
    id              VARCHAR(20)  NOT NULL,
    tenant_id       VARCHAR(20)  NOT NULL,
    label           VARCHAR(150) NOT NULL,
    url             VARCHAR(300) NOT NULL,         -- Usually the matches URL
    standings_url   VARCHAR(300) NULL,
    external_id     VARCHAR(50)  NULL,         -- ID from the portal (e.g. 54316)
    last_synced_at  DATETIME     NULL,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fed_champ_tenant (tenant_id),
    CONSTRAINT fk_fed_champ_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── FEDERATION MATCHES ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS federation_matches (
    id                  VARCHAR(20)  NOT NULL,
    championship_id     VARCHAR(20)  NOT NULL,
    match_number        VARCHAR(20)  NULL,
    match_date          DATETIME     NULL,
    home_team           VARCHAR(150) NOT NULL,
    away_team           VARCHAR(150) NOT NULL,
    home_score          TINYINT      NULL,
    away_score          TINYINT      NULL,
    set_scores          VARCHAR(255) NULL,         -- e.g. "25-12, 18-25, ..."
    status              VARCHAR(30)  NOT NULL DEFAULT 'scheduled',
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fed_match_champ (championship_id),
    CONSTRAINT fk_fed_match_champ FOREIGN KEY (championship_id) REFERENCES federation_championships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── FEDERATION STANDINGS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS federation_standings (
    id                  VARCHAR(20)  NOT NULL,
    championship_id     VARCHAR(20)  NOT NULL,
    position           SMALLINT     NOT NULL,
    team                VARCHAR(150) NOT NULL,
    points              SMALLINT     NOT NULL DEFAULT 0,
    played              SMALLINT     NOT NULL DEFAULT 0,
    won                 SMALLINT     NOT NULL DEFAULT 0,
    lost                SMALLINT     NOT NULL DEFAULT 0,
    sets_won            SMALLINT     NOT NULL DEFAULT 0,
    sets_lost           SMALLINT     NOT NULL DEFAULT 0,
    points_won          SMALLINT     NOT NULL DEFAULT 0,
    points_lost         SMALLINT     NOT NULL DEFAULT 0,
    penalty             SMALLINT     NOT NULL DEFAULT 0,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fed_stand_champ (championship_id),
    CONSTRAINT fk_fed_stand_champ FOREIGN KEY (championship_id) REFERENCES federation_championships(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
