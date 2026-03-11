-- V055__staff_document_files.sql
-- Add file attachment columns to staff_members for contract, ID doc, and CF doc

ALTER TABLE `staff_members`
    ADD COLUMN `contract_file_path` VARCHAR(255) NULL AFTER `contract_monthly_fee`,
    ADD COLUMN `id_doc_file_path`   VARCHAR(255) NULL AFTER `contract_file_path`,
    ADD COLUMN `cf_doc_file_path`   VARCHAR(255) NULL AFTER `id_doc_file_path`;
