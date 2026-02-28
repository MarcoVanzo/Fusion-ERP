-- V002__sports.sql — Teams, Athletes, Events, Metrics
-- Administrator configures the DB from Aruba panel

-- ─── TEAMS ────────────────────────────────────────────────────────────────────
CREATE TABLE teams (
    id         VARCHAR(20)  NOT NULL,           -- e.g. TEAM_u13a
    name       VARCHAR(100) NOT NULL,
    category   VARCHAR(30)  NOT NULL,           -- e.g. U13, U14, U16, B1
    season     VARCHAR(10)  NOT NULL,           -- e.g. 2025-26
    coach_id   VARCHAR(20)  NULL,
    color_hex  VARCHAR(7)   NULL DEFAULT '#E6007E',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    deleted_at DATETIME     NULL,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_teams_category (category),
    INDEX idx_teams_deleted_at (deleted_at),
    CONSTRAINT fk_teams_coach FOREIGN KEY (coach_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── ATHLETES ─────────────────────────────────────────────────────────────────
CREATE TABLE athletes (
    id              VARCHAR(20)  NOT NULL,       -- e.g. ATH_a3f8b2c1
    user_id         VARCHAR(20)  NULL,           -- linked user account (optional)
    team_id         VARCHAR(20)  NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    jersey_number   TINYINT      NULL,
    role            VARCHAR(50)  NULL,           -- e.g. Playmaker, Ala, Centro
    birth_date      DATE         NULL,
    height_cm       SMALLINT     NULL,
    weight_kg       DECIMAL(5,1) NULL,
    photo_path      VARCHAR(500) NULL,
    parent_contact  VARCHAR(150) NULL,           -- per minori
    parent_phone    VARCHAR(30)  NULL,
    is_active       TINYINT(1)   NOT NULL DEFAULT 1,
    deleted_at      DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_athletes_team (team_id),
    INDEX idx_athletes_deleted_at (deleted_at),
    CONSTRAINT fk_athletes_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE RESTRICT,
    CONSTRAINT fk_athletes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── EVENTS (allenamenti + trasferte) ─────────────────────────────────────────
CREATE TABLE events (
    id            VARCHAR(20)  NOT NULL,         -- e.g. EVT_b7d2e9f4
    team_id       VARCHAR(20)  NOT NULL,
    type          VARCHAR(30)  NOT NULL,         -- training, away_game, home_game, tournament
    title         VARCHAR(200) NOT NULL,
    event_date    DATETIME     NOT NULL,
    event_end     DATETIME     NULL,
    location_name VARCHAR(200) NULL,
    location_lat  DECIMAL(10,7) NULL,
    location_lng  DECIMAL(10,7) NULL,
    notes         TEXT         NULL,
    status        VARCHAR(30)  NOT NULL DEFAULT 'scheduled',  -- scheduled, confirmed, cancelled
    created_by    VARCHAR(20)  NULL,
    deleted_at    DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_events_team_date (team_id, event_date),
    INDEX idx_events_type (type),
    INDEX idx_events_status (status),
    INDEX idx_events_deleted_at (deleted_at),
    CONSTRAINT fk_events_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE RESTRICT,
    CONSTRAINT fk_events_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── EVENT ATTENDEES ──────────────────────────────────────────────────────────
CREATE TABLE event_attendees (
    id          VARCHAR(20)  NOT NULL,
    event_id    VARCHAR(20)  NOT NULL,
    athlete_id  VARCHAR(20)  NOT NULL,
    status      VARCHAR(30)  NOT NULL DEFAULT 'invited', -- invited, confirmed, absent, excused
    notified_at DATETIME     NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_attendee_event_athlete (event_id, athlete_id),
    INDEX idx_attendees_event (event_id),
    INDEX idx_attendees_athlete (athlete_id),
    CONSTRAINT fk_attendees_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_attendees_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── METRICS LOGS (Training Load for ACWR) ────────────────────────────────────
CREATE TABLE metrics_logs (
    id          VARCHAR(20)   NOT NULL,          -- e.g. MET_c8e1f3a9
    athlete_id  VARCHAR(20)   NOT NULL,
    event_id    VARCHAR(20)   NULL,              -- nullable: can log without event
    log_date    DATE          NOT NULL,
    duration_min SMALLINT     NOT NULL DEFAULT 0, -- minutes played/trained
    rpe         TINYINT       NOT NULL DEFAULT 5, -- Rate of Perceived Exertion 1-10
    load_value  DECIMAL(8,2)  NOT NULL,           -- duration_min * rpe
    acwr_score  DECIMAL(6,4)  NULL,               -- calculated on insert
    notes       TEXT          NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_metrics_athlete_date (athlete_id, log_date),
    INDEX idx_metrics_event (event_id),
    CONSTRAINT fk_metrics_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    CONSTRAINT fk_metrics_event   FOREIGN KEY (event_id)   REFERENCES events(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── AI SUMMARIES ─────────────────────────────────────────────────────────────
CREATE TABLE ai_summaries (
    id            VARCHAR(20)  NOT NULL,
    athlete_id    VARCHAR(20)  NOT NULL,
    period_start  DATE         NOT NULL,
    period_end    DATE         NOT NULL,
    summary_text  LONGTEXT     NOT NULL,
    model_version VARCHAR(50)  NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ai_athlete (athlete_id),
    CONSTRAINT fk_ai_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
