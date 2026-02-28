-- V003__transport.sql — Carpool Routes & Passengers
-- Dependencies: V002__sports.sql

USE fusion_erp;

-- ─── CARPOOL ROUTES ───────────────────────────────────────────────────────────
CREATE TABLE carpool_routes (
    id                VARCHAR(20)  NOT NULL,     -- e.g. CAR_d4f7a1b3
    event_id          VARCHAR(20)  NOT NULL,
    driver_user_id    VARCHAR(20)  NOT NULL,     -- utente che guida
    driver_athlete_id VARCHAR(20)  NULL,         -- se il driver è genitore di un atleta
    meeting_point_name VARCHAR(200) NULL,
    meeting_point_lat DECIMAL(10,7) NULL,
    meeting_point_lng DECIMAL(10,7) NULL,
    departure_time    DATETIME     NULL,
    seats_total       TINYINT      NOT NULL DEFAULT 4,
    seats_available   TINYINT      NOT NULL DEFAULT 3, -- seats_total - 1 (driver)
    distance_km       DECIMAL(8,2) NULL,         -- populated after Maps API call
    reimbursement_eur DECIMAL(8,2) NULL,         -- km * tariffa
    status            VARCHAR(30)  NOT NULL DEFAULT 'open', -- open, full, confirmed, cancelled
    notes             TEXT         NULL,
    deleted_at        DATETIME     NULL,
    created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_carpool_event (event_id),
    INDEX idx_carpool_driver (driver_user_id),
    INDEX idx_carpool_status (status),
    CONSTRAINT fk_carpool_event  FOREIGN KEY (event_id)       REFERENCES events(id)    ON DELETE CASCADE,
    CONSTRAINT fk_carpool_driver FOREIGN KEY (driver_user_id) REFERENCES users(id)     ON DELETE RESTRICT,
    CONSTRAINT fk_carpool_driver_athlete FOREIGN KEY (driver_athlete_id) REFERENCES athletes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── CARPOOL PASSENGERS ───────────────────────────────────────────────────────
CREATE TABLE carpool_passengers (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    route_id      VARCHAR(20)  NOT NULL,
    athlete_id    VARCHAR(20)  NOT NULL,
    requested_by  VARCHAR(20)  NULL,             -- parent user who requested
    pickup_lat    DECIMAL(10,7) NULL,
    pickup_lng    DECIMAL(10,7) NULL,
    pickup_address VARCHAR(300) NULL,
    status        ENUM('requested','confirmed','rejected','cancelled') NOT NULL DEFAULT 'requested',
    confirmed_at  DATETIME     NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_passenger_route_athlete (route_id, athlete_id),
    INDEX idx_passengers_route (route_id),
    INDEX idx_passengers_athlete (athlete_id),
    CONSTRAINT fk_passengers_route   FOREIGN KEY (route_id)   REFERENCES carpool_routes(id) ON DELETE CASCADE,
    CONSTRAINT fk_passengers_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id)       ON DELETE CASCADE,
    CONSTRAINT fk_passengers_requester FOREIGN KEY (requested_by) REFERENCES users(id)      ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── MILEAGE REIMBURSEMENTS ───────────────────────────────────────────────────
CREATE TABLE mileage_reimbursements (
    id              VARCHAR(20)  NOT NULL,       -- e.g. MIL_e5g8b2f4
    carpool_id      VARCHAR(20)  NOT NULL,
    user_id         VARCHAR(20)  NOT NULL,
    distance_km     DECIMAL(8,2) NOT NULL,
    rate_eur_km     DECIMAL(6,4) NOT NULL,
    total_eur       DECIMAL(8,2) NOT NULL,
    pdf_path        VARCHAR(500) NULL,
    status          VARCHAR(30)  NOT NULL DEFAULT 'pending', -- pending, approved, paid
    approved_by     VARCHAR(20)  NULL,
    approved_at     DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_reimbursements_user (user_id),
    INDEX idx_reimbursements_carpool (carpool_id),
    CONSTRAINT fk_reimb_carpool   FOREIGN KEY (carpool_id) REFERENCES carpool_routes(id)  ON DELETE RESTRICT,
    CONSTRAINT fk_reimb_user      FOREIGN KEY (user_id)    REFERENCES users(id)           ON DELETE RESTRICT,
    CONSTRAINT fk_reimb_approver  FOREIGN KEY (approved_by) REFERENCES users(id)          ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── EMAIL NOTIFICATIONS LOG ──────────────────────────────────────────────────
CREATE TABLE email_logs (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    event_id    VARCHAR(20)  NULL,
    recipient   VARCHAR(255) NOT NULL,
    subject     VARCHAR(300) NOT NULL,
    type        VARCHAR(50)  NOT NULL,           -- convocation, carpool_confirm, cert_expiry
    status      ENUM('sent','failed','pending') NOT NULL DEFAULT 'pending',
    sent_at     DATETIME     NULL,
    error_msg   TEXT         NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_email_event (event_id),
    INDEX idx_email_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
