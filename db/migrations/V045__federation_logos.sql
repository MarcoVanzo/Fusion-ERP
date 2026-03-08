-- V045__federation_logos.sql — Add logo columns to federation tables
-- Allows storing and displaying team logos scraped from external portals.

ALTER TABLE federation_standings
ADD COLUMN logo VARCHAR(300) NULL AFTER team;

ALTER TABLE federation_matches
ADD COLUMN home_logo VARCHAR(300) NULL AFTER home_team,
ADD COLUMN away_logo VARCHAR(300) NULL AFTER away_team;
