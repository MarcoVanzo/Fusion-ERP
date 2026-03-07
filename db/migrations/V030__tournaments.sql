-- V030__tournaments.sql — Tournaments schemas (extending events)

-- ─── TOURNAMENT DETAILS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_details (
    event_id            VARCHAR(20)   NOT NULL,
    website_url         VARCHAR(300)  NULL,
    fee_per_athlete     DECIMAL(8,2)  NULL DEFAULT 0.00,
    accommodation_info  TEXT          NULL,
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    CONSTRAINT fk_tourney_event  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ─── TOURNAMENT MATCHES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tournament_matches (
    id                  VARCHAR(20)   NOT NULL,         -- e.g. TMT_d8a4f1b2
    event_id            VARCHAR(20)   NOT NULL,
    match_time          DATETIME      NOT NULL,
    opponent_name       VARCHAR(150)  NOT NULL,
    court_name          VARCHAR(100)  NULL,
    our_score           SMALLINT      NULL DEFAULT 0,
    opponent_score      SMALLINT      NULL DEFAULT 0,
    status              VARCHAR(30)   NOT NULL DEFAULT 'scheduled', -- scheduled, played, cancelled
    created_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_tourney_match_event (event_id),
    CONSTRAINT fk_tourney_match_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
