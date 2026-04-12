-- V111__add_summary_pdf_path.sql — Link persisted tournament summary PDF to tournament
-- SAFE: Adds optional column summary_pdf_path to tournament_details table

ALTER TABLE tournament_details ADD COLUMN summary_pdf_path VARCHAR(255) NULL AFTER rooming_list_path;
