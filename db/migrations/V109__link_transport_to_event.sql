-- V109__link_transport_to_event.sql — Link transports to events (tournaments)
-- SAFE: Adds optional column event_id to transports table

ALTER TABLE transports ADD COLUMN event_id VARCHAR(20) NULL AFTER team_id;
ALTER TABLE transports ADD CONSTRAINT fk_transports_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;
ALTER TABLE transports ADD INDEX idx_transports_event (event_id);
