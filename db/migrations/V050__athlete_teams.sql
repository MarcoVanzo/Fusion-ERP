-- V050: athlete_teams junction table
-- Permette di abbinare un atleta a più squadre (relazione N:N)
-- Il campo team_id in athletes rimane come "squadra principale" per compatibilità.

CREATE TABLE IF NOT EXISTS athlete_teams (
    athlete_id  VARCHAR(32)  NOT NULL,
    team_id     VARCHAR(32)  NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (athlete_id, team_id),
    KEY idx_athlete_teams_team   (team_id),
    KEY idx_athlete_teams_athlete (athlete_id),
    CONSTRAINT fk_at_athlete FOREIGN KEY (athlete_id) REFERENCES athletes (id) ON DELETE CASCADE,
    CONSTRAINT fk_at_team    FOREIGN KEY (team_id)    REFERENCES teams    (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Popola athlete_teams con i dati già esistenti (squadra attuale come prima entry)
INSERT IGNORE INTO athlete_teams (athlete_id, team_id)
SELECT id, team_id
FROM athletes
WHERE team_id IS NOT NULL
  AND deleted_at IS NULL;
