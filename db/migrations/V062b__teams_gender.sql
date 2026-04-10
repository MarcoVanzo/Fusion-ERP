-- Adds gender column to teams table

ALTER TABLE teams
ADD COLUMN gender ENUM('M', 'F') NULL DEFAULT NULL AFTER name;
