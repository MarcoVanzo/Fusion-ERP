-- V110__add_rooming_list_path.sql — Link persisted rooming list PDF to tournament
-- SAFE: Adds optional column rooming_list_path to tournament_details table

ALTER TABLE tournament_details ADD COLUMN rooming_list_path VARCHAR(255) NULL AFTER accommodation_info;
