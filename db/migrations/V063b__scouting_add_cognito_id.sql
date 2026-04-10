ALTER TABLE scouting_athletes
    ADD COLUMN cognito_id INT NULL AFTER id,
    ADD COLUMN cognito_form VARCHAR(50) NULL AFTER cognito_id,
    ADD COLUMN synced_at TIMESTAMP NULL AFTER created_at,
    ADD UNIQUE KEY uq_cognito (cognito_id, cognito_form);
