-- V066__athlete_documents.sql
-- Add file attachment columns to athletes for contract, ID doc, CF doc, and medical cert

ALTER TABLE `athletes`
    ADD COLUMN `contract_file_path` VARCHAR(255) NULL,
    ADD COLUMN `id_doc_front_file_path` VARCHAR(255) NULL,
    ADD COLUMN `id_doc_back_file_path` VARCHAR(255) NULL,
    ADD COLUMN `cf_doc_front_file_path` VARCHAR(255) NULL,
    ADD COLUMN `cf_doc_back_file_path` VARCHAR(255) NULL,
    ADD COLUMN `medical_cert_file_path` VARCHAR(255) NULL;
