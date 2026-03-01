-- V007__transports.sql — Transports (route planning & history)
-- Dependencies: V002__sports.sql

CREATE TABLE transports (
    id                  VARCHAR(20)  NOT NULL,
    team_id             VARCHAR(20)  NOT NULL,
    destination_name    VARCHAR(200) NOT NULL,
    destination_address VARCHAR(300) NULL,
    destination_lat     DECIMAL(10,7) NULL,
    destination_lng     DECIMAL(10,7) NULL,
    departure_address   VARCHAR(300) NULL,
    arrival_time        TIME         NOT NULL,
    departure_time      TIME         NULL,
    transport_date      DATE         NOT NULL,
    athletes_json       JSON         NOT NULL,
    timeline_json       JSON         NULL,
    stats_json          JSON         NULL,
    ai_response         JSON         NULL,
    created_by          VARCHAR(20)  NULL,
    created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_transports_team (team_id),
    INDEX idx_transports_date (transport_date),
    CONSTRAINT fk_transports_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE RESTRICT,
    CONSTRAINT fk_transports_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Gyms / destinations table for reuse
CREATE TABLE gyms (
    id              VARCHAR(20)  NOT NULL,
    name            VARCHAR(200) NOT NULL,
    address         VARCHAR(300) NULL,
    lat             DECIMAL(10,7) NULL,
    lng             DECIMAL(10,7) NULL,
    created_by      VARCHAR(20)  NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_gyms_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
